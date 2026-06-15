"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setProfile(null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  }

  async function signInWithEmail(email) {
    return supabase.auth.signInWithOtp({ email });
  }

  async function verifyOtp(email, token) {
    return supabase.auth.verifyOtp({ email, token, type: "email" });
  }

  async function signInWithProvider(provider) {
    return supabase.auth.signInWithOAuth({ provider });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function createProfile(data) {
    const { data: created, error } = await supabase
      .from("profiles")
      .insert([{ id: user.id, ...data }])
      .select()
      .single();
    if (created) setProfile(created);
    return { data: created, error };
  }

  return (
    <AuthContext.Provider
      value={{
        user, profile, loading,
        signInWithEmail, verifyOtp, signInWithProvider,
        signOut, createProfile, fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
