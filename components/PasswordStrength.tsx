'use client';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = calculateStrength(password);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: level <= strength.score ? strength.color : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>
      {password && (
        <p style={{ fontSize: '0.75rem', color: strength.color, fontFamily: 'var(--font-condensed)', letterSpacing: '0.04em' }}>
          {strength.label}
        </p>
      )}
    </div>
  );
}

function calculateStrength(password: string): { score: number; color: string; label: string } {
  if (!password) return { score: 0, color: 'rgba(255,255,255,0.1)', label: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, color: '#EF4444', label: 'Weak' };
  if (score === 2) return { score: 2, color: '#F59E0B', label: 'Fair' };
  if (score === 3) return { score: 3, color: '#10B981', label: 'Good' };
  return { score: 4, color: '#059669', label: 'Strong' };
}
