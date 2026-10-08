/** Password sign-in screen shown before any budget data is loaded. */
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';
import { FiEye, FiEyeOff, FiLock, FiPieChart } from 'react-icons/fi';
import ThemeToggle from '../components/common/ThemeToggle';
import { APP_NAME, DEFAULT_OWNER_NAME } from '../constants';

export default function LoginPage({ onLogin, sessionExpired }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setIsSigningIn(true);
    setError('');
    try {
      await onLogin(password);
    } catch (loginError) {
      setError(loginError.message);
      setIsSigningIn(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-page__theme">
        <ThemeToggle />
      </div>
      <section className="login-card" aria-labelledby="login-title">
        <div className="app-brand login-card__brand">
          <span className="app-brand__logo" aria-hidden="true">
            <FiPieChart />
          </span>
          <span className="app-brand__text">
            <span className="app-brand__name">{DEFAULT_OWNER_NAME}</span>
            <span className="app-brand__tagline">{APP_NAME}</span>
          </span>
        </div>

        <h1 id="login-title" className="login-card__title">
          Sign in
        </h1>
        <p className="login-card__subtitle">
          {sessionExpired
            ? 'Your session has ended. Please sign in again.'
            : 'Enter your password to open your budget.'}
        </p>

        <Form noValidate onSubmit={handleSubmit}>
          <Form.Group controlId="login-password" className="mb-3">
            <Form.Label>Password</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text aria-hidden="true">
                <FiLock />
              </InputGroup.Text>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                isInvalid={Boolean(error)}
                autoComplete="current-password"
                autoFocus
                aria-describedby={error ? 'login-error' : undefined}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </Button>
              {error && (
                <Form.Control.Feedback type="invalid" id="login-error" role="alert">
                  {error}
                </Form.Control.Feedback>
              )}
            </InputGroup>
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100" disabled={isSigningIn}>
            {isSigningIn && <Spinner animation="border" size="sm" aria-hidden="true" />}
            {isSigningIn ? 'Signing in...' : 'Sign in'}
          </Button>
        </Form>
      </section>
    </main>
  );
}
