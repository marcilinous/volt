"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { uploadPhoto } from "@/lib/storage";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ChipSelector from "@/components/ui/ChipSelector";
import { RELIGIONS, LANGUAGES, INTENTS, USER_TYPES, INCOME_BRACKETS, AI_PROMPTS } from "@/lib/constants";
import { ArrowLeft, Plus, X } from "lucide-react";

const STEPS = ["photos", "details", "prompts", "intent"];

export default function OnboardingPage() {
  const { user, createProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [photos, setPhotos] = useState([]); // Array of { localPreview, publicUrl }
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [userCategory, setUserCategory] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [religion, setReligion] = useState("");
  const [languages, setLanguages] = useState([]);
  const [income, setIncome] = useState("");
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [intent, setIntent] = useState("");
  const [uploadError, setUploadError] = useState("");

  const current = STEPS[step];

  const canProceed = () => {
    switch (current) {
      case "photos": return photos.length >= 1 && !uploadingPhoto;
      case "details": return displayName && dob && gender && userCategory && birthCity && currentCity && languages.length > 0;
      case "prompts": return answers.some((a) => a.trim());
      case "intent": return !!intent;
    }
  };

  const handlePhotoUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    setUploadError("");

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { localPreview, publicUrl: null, uploading: true };
      return updated;
    });

    // Upload to Supabase Storage
    const { url, error } = await uploadPhoto(file, user.id, index);

    if (error) {
      setUploadError(error);
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      setUploadingPhoto(false);
      return;
    }

    // Replace preview with real public URL
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

  const handleNext = async () => {
    if (step < STEPS.length - 1) return setStep(step + 1);

    setLoading(true);
    const photoUrls = photos.map((p) => p.publicUrl).filter(Boolean);

    await createProfile({
      display_name: displayName,
      date_of_birth: dob,
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
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-5 py-8">
      <div className="w-full max-w-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer">
              <ArrowLeft size={20} />
            </button>
          ) : <div className="w-5" />}

          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i <= step ? "bg-accent" : "bg-[var(--border)]"
                } ${i === step ? "w-6" : "w-2"}`}
              />
            ))}
          </div>

          <span className="text-xs text-[var(--muted)]">{step + 1}/{STEPS.length}</span>
        </div>

        {/* Photos step */}
        {current === "photos" && (
          <>
            <h1 className="text-2xl font-bold mb-1">Add your photos</h1>
            <p className="text-[var(--muted)] mb-6">At least 1 photo required. Up to 6.</p>
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius)] text-red-700 text-sm">
                {uploadError}
              </div>
            )}
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
                          <button
                            onClick={() => handleRemovePhoto(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-accent rounded-full flex items-center justify-center cursor-pointer"
                          >
                            <X size={12} className="text-white" />
                          </button>
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
                        {i === 0 && <span className="text-[9px] font-semibold tracking-wider text-[var(--muted)] mt-1">REQUIRED</span>}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, i)} />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Details step */}
        {current === "details" && (
          <>
            <h1 className="text-2xl font-bold mb-6">About you</h1>
            <Input label="Display name" placeholder="What should we call you?" value={displayName} onChange={setDisplayName} maxLength={100} />
            <Input label="Date of birth" type="date" value={dob} onChange={setDob} />
            <ChipSelector label="Gender" options={[{ key: "M", label: "Male" }, { key: "F", label: "Female" }, { key: "O", label: "Other" }]} selected={gender} onToggle={setGender} multi={false} />
            <ChipSelector label="I am a" options={USER_TYPES} selected={userCategory} onToggle={setUserCategory} multi={false} />
            <Input label="Birth city" placeholder="Where are you from?" value={birthCity} onChange={setBirthCity} />
            <Input label="Current city" placeholder="Where do you live now?" value={currentCity} onChange={setCurrentCity} />
            <ChipSelector label="Languages" options={LANGUAGES} selected={languages} onToggle={setLanguages} />
            <ChipSelector label="Religion (optional)" options={RELIGIONS} selected={religion} onToggle={setReligion} multi={false} />
            <Input label="Profession (optional)" placeholder="What do you do?" value={profession} onChange={setProfession} />
            <ChipSelector label="Monthly income (optional)" options={INCOME_BRACKETS} selected={income} onToggle={setIncome} multi={false} />
            <Input label="Bio (optional)" placeholder="Something about you..." value={bio} onChange={setBio} multiline maxLength={500} />
          </>
        )}

        {/* Prompts step */}
        {current === "prompts" && (
          <>
            <h1 className="text-2xl font-bold mb-1">Answer some prompts</h1>
            <p className="text-[var(--muted)] mb-6">These help others start a conversation.</p>
            {AI_PROMPTS.map((q, i) => (
              <div key={i} className="mb-6">
                <p className="text-base font-semibold italic text-[var(--text)] mb-2">{q}</p>
                <Input
                  placeholder="Your answer..."
                  value={answers[i]}
                  onChange={(v) => { const a = [...answers]; a[i] = v; setAnswers(a); }}
                  multiline
                  maxLength={200}
                />
              </div>
            ))}
          </>
        )}

        {/* Intent step */}
        {current === "intent" && (
          <>
            <h1 className="text-2xl font-bold mb-6">What are you looking for?</h1>
            <div className="space-y-3">
              {INTENTS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setIntent(item.key)}
                  className={`w-full text-left p-5 rounded-[var(--radius)] border transition-all cursor-pointer ${
                    intent === item.key
                      ? "border-accent bg-accent/5"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]"
                  }`}
                >
                  <p className={`text-lg font-semibold ${intent === item.key ? "text-accent" : "text-[var(--text)]"}`}>
                    {item.label}
                  </p>
                  <p className="text-sm text-[var(--muted)] mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="mt-8">
          <Button onClick={handleNext} disabled={!canProceed()} loading={loading || uploadingPhoto}>
            {step === STEPS.length - 1 ? "Finish Profile" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
