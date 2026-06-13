import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Discord will activate automatically when DISCORD_CLIENT_SECRET is set correctly
    ...(process.env.DISCORD_CLIENT_SECRET && !process.env.DISCORD_CLIENT_SECRET.startsWith("GANTI")
      ? [DiscordProvider({
          clientId: process.env.DISCORD_CLIENT_ID!,
          clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        })]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // After successful OAuth, call our Rust backend to register/login the user
      try {
        const apiHost = process.env.NEXTAUTH_URL?.replace(/:3000.*/, '').replace(/https?:\/\//, '') || 'localhost';
        const res = await fetch(`http://${apiHost}:8080/api/auth/social`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name || user.email?.split("@")[0] || "user",
            provider: account?.provider || "unknown",
            provider_id: account?.providerAccountId || "",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            // Attach the JWT token from our Rust backend to the user object
            (user as any).backendToken = data.token;
            (user as any).backendUserId = data.user_id;
          }
        }
      } catch (e) {
        console.error("Failed to sync with Rust backend:", e);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = (user as any).backendToken;
        token.backendUserId = (user as any).backendUserId;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).backendToken = token.backendToken;
      (session as any).backendUserId = token.backendUserId;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
