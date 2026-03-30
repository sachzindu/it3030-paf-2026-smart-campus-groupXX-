package com.paf.smarthub.shared.enums;

/**
 * Distinguishes how a user account was created.
 * LOCAL: registered with email/password via the signup form.
 * GOOGLE: created automatically on first Google OAuth2 login.
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
