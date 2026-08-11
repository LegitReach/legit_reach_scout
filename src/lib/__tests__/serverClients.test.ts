const mockCreateClient = jest.fn(() => ({ client: true }));

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

import { getAdminClient, getAuthenticatedClient } from "../supabaseServer";

describe("server client credential validation", () => {
  const originalEnvironment = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  afterEach(() => {
    mockCreateClient.mockClear();
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("does not validate Supabase credentials until a client is requested", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    expect(() => getAuthenticatedClient("token")).toThrow("SUPABASE_URL is not set");
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("creates an authenticated client with the bearer token", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY = "anon-key";

    getAuthenticatedClient("clerk-token");

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      {
        global: { headers: { Authorization: "Bearer clerk-token" } },
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
  });

  it("lets the admin client depend only on its own credentials", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";

    getAdminClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  });
});
