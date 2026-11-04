import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Multi-language code runner used by the chat sandbox.
 *
 * Hardening: no shell, isolated temp directory per run, hard wall-clock timeout,
 * bounded output, and a production gate — arbitrary execution is refused in
 * production unless SANDBOX_ALLOW=true, because a real deployment must isolate
 * runs in a container or microVM rather than on the API host.
 */
export const LANGUAGES = {
  javascript: { label: 'JavaScript', extension: 'mjs', kind: 'interpreted' },
  python: { label: 'Python', extension: 'py', kind: 'interpreted' },
  c: { label: 'C', extension: 'c', kind: 'compiled' },
  cpp: { label: 'C++', extension: 'cpp', kind: 'compiled' },
  java: { label: 'Java', extension: 'java', kind: 'compiled' },
};

const TIMEOUT_MS = Number(process.env.SANDBOX_TIMEOUT_MS ?? 8000);
const MAX_OUTPUT = 20_000;
const MAX_CODE = 20_000;

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = process.hrtime.bigint();
    execFile(
      command,
      args,
      {
        timeout: TIMEOUT_MS,
        killSignal: 'SIGKILL',
        maxBuffer: MAX_OUTPUT * 8,
        windowsHide: true,
        cwd: options.cwd,
        env: { PATH: process.env.PATH, HOME: options.cwd, TMPDIR: options.cwd, PYTHONIOENCODING: 'utf-8' },
      },
      (error, stdout, stderr) => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        resolve({
          stdout: (stdout ?? '').slice(0, MAX_OUTPUT),
          stderr: (stderr ?? '').slice(0, MAX_OUTPUT),
          exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
          timedOut: Boolean(error?.killed || error?.signal === 'SIGKILL'),
          missing: error?.code === 'ENOENT',
          durationMs: Math.round(durationMs),
        });
      },
    );
  });
}

const compilerFor = (language) => {
  const overrides = {
    c: process.env.CC_BIN,
    cpp: process.env.CXX_BIN,
    java: process.env.JAVAC_BIN,
    python: process.env.PYTHON_BIN,
  };
  if (overrides[language]) return overrides[language];
  if (language === 'c') return 'gcc';
  if (language === 'cpp') return 'g++';
  if (language === 'java') return 'javac';
  return process.platform === 'win32' ? 'python' : 'python3';
};

export async function runCode({ language, code }) {
  const spec = LANGUAGES[language];
  if (!spec) return { supported: false, message: `Unsupported language. Choose one of: ${Object.keys(LANGUAGES).join(', ')}.` };
  if (typeof code !== 'string' || !code.trim()) return { supported: false, message: 'No code supplied.' };
  if (code.length > MAX_CODE) return { supported: false, message: `Code is too long (limit ${MAX_CODE} characters).` };
  if (process.env.NODE_ENV === 'production' && process.env.SANDBOX_ALLOW !== 'true') {
    return {
      supported: false,
      message:
        'Code execution is disabled in production unless SANDBOX_ALLOW=true. Deploy the sandbox behind container isolation before enabling it.',
    };
  }

  const dir = await mkdtemp(path.join(os.tmpdir(), 'atlas-sandbox-'));
  const source = path.join(dir, `main.${spec.extension}`);
  const binary = path.join(dir, process.platform === 'win32' ? 'main.exe' : 'main');

  try {
    await writeFile(source, code, 'utf8');
    let result;

    if (language === 'javascript') {
      result = await run(process.execPath, ['--no-warnings', source], { cwd: dir });
    } else if (language === 'python') {
      result = await run(compilerFor('python'), ['-I', source], { cwd: dir });
    } else if (language === 'c') {
      const compiled = await run(compilerFor('c'), [source, '-O1', '-o', binary], { cwd: dir });
      if (compiled.missing) return { supported: false, message: 'The C compiler (gcc) is not installed on this host.' };
      if (compiled.exitCode !== 0) return { supported: true, ...compiled, phase: 'compile' };
      result = await run(binary, [], { cwd: dir });
    } else if (language === 'cpp') {
      const compiled = await run(compilerFor('cpp'), [source, '-std=c++17', '-O1', '-o', binary], { cwd: dir });
      if (compiled.missing) return { supported: false, message: 'The C++ compiler (g++) is not installed on this host.' };
      if (compiled.exitCode !== 0) return { supported: true, ...compiled, phase: 'compile' };
      result = await run(binary, [], { cwd: dir });
    } else {
      const compiled = await run(compilerFor('java'), [source], { cwd: dir });
      if (compiled.missing) return { supported: false, message: 'The Java compiler (javac) is not installed on this host.' };
      if (compiled.exitCode !== 0) return { supported: true, ...compiled, phase: 'compile' };
      result = await run('java', ['-cp', dir, 'Main'], { cwd: dir });
    }

    if (result.missing) {
      return {
        supported: false,
        message: `${spec.label} runtime not found on this host. Set the corresponding *_BIN environment variable if it lives elsewhere.`,
      };
    }

    return {
      supported: true,
      language,
      label: spec.label,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      durationMs: result.durationMs,
      phase: result.phase ?? 'run',
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
