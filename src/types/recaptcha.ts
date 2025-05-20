export type RecaptchaSiteVerifyResponse = {
  success: boolean;              // true if verification passed
  score?: number;                // score from 0.0 (bad) to 1.0 (good) for v3
  action?: string;               // the action name from client side
  challenge_ts?: string;         // timestamp of the challenge (ISO format)
  hostname?: string;             // the domain of the site where the reCAPTCHA was solved
  'error-codes'?: string[];      // list of error codes, if any
};
