'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

const SESSION_COOKIE = 'audio_review_session';

function hashToken(token) {
    return crypto
        .createHash('sha256')
        .update(String(token || ''))
        .digest('hex');
}

function normalizeTokenEntries(value) {
    if (!Array.isArray(value) || value.length === 0) throw new Error('Audio review token list must be non-empty');
    const ids = new Set();
    return value.map((entry) => {
        const id = String(entry.id || '').trim();
        const name = String(entry.name || '').trim();
        const role = String(entry.role || 'reviewer').trim();
        const tokenHash = String(entry.tokenHash || '')
            .replace(/^sha256:/, '')
            .trim()
            .toLowerCase();
        if (!id || !name || !/^[a-f0-9]{64}$/.test(tokenHash)) {
            throw new Error('Each audio review token entry requires id, name, and a SHA-256 tokenHash');
        }
        if (!['reviewer', 'admin'].includes(role)) throw new Error(`Unsupported audio review role: ${role}`);
        if (ids.has(id)) throw new Error(`Duplicate audio review token id: ${id}`);
        ids.add(id);
        return { id, name, role, tokenHash };
    });
}

function loadTokenEntries({ tokenFile, tokenJson }) {
    if (tokenJson) return normalizeTokenEntries(JSON.parse(tokenJson));
    if (!tokenFile || !fs.existsSync(tokenFile)) {
        throw new Error(`Missing audio review token file: ${tokenFile || '(not configured)'}`);
    }
    return normalizeTokenEntries(JSON.parse(fs.readFileSync(tokenFile, 'utf8')));
}

function parseCookies(header) {
    return Object.fromEntries(
        String(header || '')
            .split(';')
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
                const separator = part.indexOf('=');
                if (separator === -1) return [part, ''];
                return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
            })
    );
}

function safeTokenEqual(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createAuthService(entries, options = {}) {
    const tokenEntries = normalizeTokenEntries(entries);
    const sessions = new Map();
    const sessionTtlMs = Number(options.sessionTtlMs || 12 * 60 * 60 * 1000);

    function authenticateToken(token) {
        const digest = hashToken(token);
        return tokenEntries.find((entry) => safeTokenEqual(entry.tokenHash, digest)) || null;
    }

    function createSession(user) {
        const sessionId = crypto.randomBytes(32).toString('base64url');
        sessions.set(sessionId, {
            user: { id: user.id, name: user.name, role: user.role },
            expiresAt: Date.now() + sessionTtlMs
        });
        return sessionId;
    }

    function sessionUser(req) {
        const authorization = String(req.headers.authorization || '');
        if (authorization.startsWith('Bearer ')) {
            const user = authenticateToken(authorization.slice(7).trim());
            return user ? { id: user.id, name: user.name, role: user.role } : null;
        }
        const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
        if (!sessionId) return null;
        const session = sessions.get(sessionId);
        if (!session || session.expiresAt <= Date.now()) {
            if (session) sessions.delete(sessionId);
            return null;
        }
        session.expiresAt = Date.now() + sessionTtlMs;
        return session.user;
    }

    function destroySession(req) {
        const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
        if (sessionId) sessions.delete(sessionId);
    }

    function sessionCookie(sessionId, secure) {
        return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
    }

    function clearSessionCookie(secure) {
        return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
    }

    return {
        authenticateToken,
        clearSessionCookie,
        createSession,
        destroySession,
        sessionCookie,
        sessionUser
    };
}

module.exports = {
    SESSION_COOKIE,
    createAuthService,
    hashToken,
    loadTokenEntries,
    normalizeTokenEntries
};
