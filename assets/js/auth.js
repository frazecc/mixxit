window.PenombraAuth = {
  normalizeUsername(value) {
    return String(value || '')
      .trim()
      .toLowerCase();
  },

  isValidUsername(username) {
    return /^[a-z0-9_-]{3,20}$/.test(username);
  },

  internalEmail(username) {
    return `${this.normalizeUsername(username)}@test.local`;
  },

  validateUsername(username) {
    if (!this.isValidUsername(username)) {
      throw new Error(
        'Username non valido. Usa 3-20 caratteri: lettere minuscole, numeri, _ oppure -.'
      );
    }
  },

  async signIn(username, password) {
    const normalized = this.normalizeUsername(username);

    this.validateUsername(normalized);

    if (!password || password.length < 8) {
      throw new Error(
        'La password deve contenere almeno 8 caratteri.'
      );
    }

    const { data, error } =
      await window.supabaseClient.auth.signInWithPassword({
        email: this.internalEmail(normalized),
        password
      });

    if (error) {
      throw new Error('Username o password non corretti.');
    }

    return data;
  },

  async signOut() {
    const { error } =
      await window.supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }
  },

  async getSession() {
    const { data, error } =
      await window.supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  },

  async getMyProfile() {
    const session = await this.getSession();

    if (!session) {
      return null;
    }

    const { data, error } =
      await window.supabaseClient
        .from('profiles')
        .select('id, username, display_name, role, created_at')
        .eq('id', session.user.id)
        .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async requireAdmin() {
    const profile = await this.getMyProfile();

    if (!profile) {
      throw new Error('Devi accedere prima di usare la Console Admin.');
    }

    if (profile.role !== 'admin') {
      throw new Error(
        'Questo account non dispone dei permessi amministratore.'
      );
    }

    return profile;
  },

  async createUser({
    username,
    password,
    displayName,
    role = 'player'
  }) {
    const normalized = this.normalizeUsername(username);

    this.validateUsername(normalized);

    if (!password || password.length < 8) {
      throw new Error(
        'La password temporanea deve contenere almeno 8 caratteri.'
      );
    }

    const { data, error } =
      await window.supabaseClient.functions.invoke(
        'admin-create-user',
        {
          body: {
            username: normalized,
            password,
            displayName: displayName || normalized,
            role
          }
        }
      );

    if (error) {
      throw error;
    }

    if (!data?.ok) {
      throw new Error(
        data?.error || 'Impossibile creare il nuovo utente.'
      );
    }

    return data.user;
  }
};
