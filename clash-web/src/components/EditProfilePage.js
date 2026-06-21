"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { uploadPhoto } from "@/lib/storage";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ChipSelector from "@/components/ui/ChipSelector";
import {
  RELIGIONS, LANGUAGES, INTENTS, USER_TYPES, INCOME_BRACKETS, AI_PROMPTS,
} from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, X, Check } from "lucide-react";

export default function EditProfilePage({ onClose }) {
  const { user, profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Initialize form state from existing profile
  const [photos, setPhotos] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [userCategory, setUserCategory] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [religion, setReligion] = useState("");
  const [languages, setLanguages] = useState([]);
  const [income, setIncome] = useState("");
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [intent, setIntent] = useState("");
  const [promptAnswers, setPromptAnswers] = useState({});

  // Populate from existing profile
  useEffect(() => {
    if (!profile) return;
    // Convert photo URLs to the {publicUrl} structure used by the photo grid
    setPhotos((profile.photos_urls || []).map((url) => ({
      publicUrl: url, localPreview: url, uploading: false,
    })));
    setDisplayName(profile.display_name || "");
    setGender(profile.gender || "");
    setUserCategory(profile.user_category || "");
    setBirthCity(profile.birth_city || "");
    setCurrentCity(profile.current_city || "");
    setReligion(profile.religion || "");
    setLanguages(profile.languages || []);
    setIncome(profile.monthly_income_bracket || "");
    setProfession(profile.profession || "");
    setBio(profile.bio || "");
    setIntent(profile.intent || "");
  }, [profile]);

  // Fetch existing prompt answers
  useEffect(() => {
    if (!user) return;
    async function fetchPrompts() {
      const { data } = await supabase
        .from("ai_prompt_responses")
        .select("*")
        .eq("user_id", user.id);
      if (data) {
        const map = {};
        data.forEach((r) => { map[r.question_id] = r.answer_text; });
        setPromptAnswers(map);
      }
    }
    fetchPrompts();
  }, [user]);

  const handlePhotoUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    setUploadError("");

    const localPreview = URL.createObjectURL(file);
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { localPreview, publicUrl: null, uploading: true };
      return updated;
    });

    const { url, error } = await uploadPhoto(file, user.id, index);
    if (error) {
      setUploadError(error);
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      setUploadingPhoto(false);
      return;
    }

    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { localPreview, publicUrl: url, uploading: false };
      return updated;
    });
    setUploadingPhoto(false);
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMovePhotoToMain = (index) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.unshift(moved);
      return updated;
    });
  };

  const handleSave = async () => {
    if (photos.length < 1) {
      setUploadError("At least 1 photo required");
      return;
    }
    if (!displayName || !gender || !userCategory || !birthCity || !currentCity || languages.length === 0 || !intent) {
      setUploadError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setUploadError("");
    setSuccessMsg("");

    const photoUrls = photos.map((p) => p.publicUrl).filter(Boolean);

    const { error } = await updateProfile({
      display_name: displayName,
      gender,
      user_category: userCategory,
      birth_city: birthCity,
      current_city: currentCity,
      religion: religion || null,
      languages,
      monthly_income_bracket: income || null,
      profession: profession || null,
      bio: bio || null,
      photos_urls: photoUrls,
      intent,
    });

    if (error) {
      setUploadError("Save failed: " + error.message);
      setSaving(false);
      return;
    }

    // Update prompt answers (upsert each one that has text)
    for (let i = 0; i < AI_PROMPTS.length; i++) {
      const qId = i + 1;
      const answer = promptAnswers[qId];
      if (answer && answer.trim()) {
        await supabase.from("ai_prompt_responses").upsert({
          user_id: user.id,
          question_id: qId,
          question_text: AI_PROMPTS[i],
          answer_text: answer.trim(),
        }, { onConflict: "user_id,question_id" });
      }
    }

    setSaving(false);
    setSuccessMsg("Profile updated");
    setTimeout(() => {
      onClose?.();
    }, 1000);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)]">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-[var(--bg)] py-2 z-10">
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-bold flex-1">Edit Profile</h2>
        </div>

        {/* Error / success banners */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius)] text-red-700 text-sm">
            {uploadError}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-[var(--radius)] text-green-700 text-sm flex items-center gap-2">
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* Photos */}
        <section className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, i) => {
              const photo = photos[i];
              return (
                <div
                  key={i}
                  className={`aspect-[4/5] rounded-[var(--radius)] border overflow-hidden relative ${
                    i === 0 ? "border-2 border-accent" : "border-[var(--border)]"
                  } bg-[var(--surface)]`}
                >
                  {photo ? (
                    <>
                      <img src={photo.localPreview} alt="" className="w-full h-full object-cover" />
                      {photo.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!photo.uploading && (
                        <>
                          <button
                            onClick={() => handleRemovePhoto(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-accent rounded-full flex items-center justify-center cursor-pointer"
                            title="Remove"
                          >
                            <X size={12} className="text-white" />
                          </button>
                          {i !== 0 && (
                            <button
                              onClick={() => handleMovePhotoToMain(i)}
                              className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-black/80"
                            >
                              SET MAIN
                            </button>
                          )}
                        </>
                      )}
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-accent text-white text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm">
                          MAIN
                        </span>
                      )}
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-[var(--border)]/20 transition-colors">
                      <Plus size={24} className="text-[var(--muted)]" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, i)} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Basic Info */}
        <section className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-3">About you</h3>
          <Input label="Display name" value={displayName} onChange={setDisplayName} maxLength={100} />
          <ChipSelector
            label="Gender"
            options={[{ key: "M", label: "Male" }, { key: "F", label: "Female" }, { key: "O", label: "Other" }]}
            selected={gender} onToggle={setGender} multi={false}
          />
          <ChipSelector label="I am a" options={USER_TYPES} selected={userCategory} onToggle={setUserCategory} multi={false} />
          <Input label="Birth city" value={birthCity} onChange={setBirthCity} />
          <Input label="Current city" value={currentCity} onChange={setCurrentCity} />
          <ChipSelector label="Languages" options={LANGUAGES} selected={languages} onToggle={setLanguages} />
          <ChipSelector label="Religion (optional)" options={RELIGIONS} selected={religion} onToggle={setReligion} multi={false} />
          <Input label="Profession (optional)" value={profession} onChange={setProfession} />
          <ChipSelector label="Monthly income (optional)" options={INCOME_BRACKETS} selected={income} onToggle={setIncome} multi={false} />
          <Input label="Bio (optional)" value={bio} onChange={setBio} multiline maxLength={500} />
        </section>

        {/* Intent */}
        <section className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Looking for</h3>
          <div className="space-y-2">
            {INTENTS.map((item) => (
              <button
                key={item.key}
                onClick={() => setIntent(item.key)}
                className={`w-full text-left p-4 rounded-[var(--radius)] border transition-all cursor-pointer ${
                  intent === item.key
                    ? "border-accent bg-accent/5"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]"
                }`}
              >
                <p className={`text-base font-semibold ${intent === item.key ? "text-accent" : "text-[var(--text)]"}`}>
                  {item.label}
                </p>
                <p className="text-sm text-[var(--muted)] mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Prompts */}
        <section className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Prompts</h3>
          {AI_PROMPTS.map((q, i) => {
            const qId = i + 1;
            return (
              <div key={qId} className="mb-5">
                <p className="text-base font-semibold italic text-[var(--text)] mb-2">{q}</p>
                <Input
                  placeholder="Your answer..."
                  value={promptAnswers[qId] || ""}
                  onChange={(v) => setPromptAnswers((prev) => ({ ...prev, [qId]: v }))}
                  multiline
                  maxLength={200}
                />
              </div>
            );
          })}
        </section>

        {/* CTAs */}
        <div className="space-y-2 pb-6">
          <Button onClick={handleSave} loading={saving || uploadingPhoto}>
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
