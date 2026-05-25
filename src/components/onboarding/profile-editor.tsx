"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { AvatarPicker } from "@/components/onboarding/avatar-picker";
import { ProfileFormSection } from "@/components/onboarding/profile-form-section";
import type {
  ProfileActionState,
  ProfileAvatarSelection,
  ProfileFormValues,
} from "@/lib/profiles/profile-form";
import type { ProfileSuggestions } from "@/lib/profiles/profile-suggestions";

type ProfileServerAction = (
  previousState: ProfileActionState,
  formData: FormData,
) => Promise<ProfileActionState>;

type ProfileEditorProps = {
  action: ProfileServerAction;
  avatarBadgeLabel?: string;
  avatarDescription?: string;
  avatarTitle?: string;
  formLabel?: string;
  initialValues: ProfileFormValues;
  savedLabel?: string;
  secondaryAction?: ReactNode;
  showSavedState?: boolean;
  submitLabel?: string;
  suggestions?: ProfileSuggestions;
};

export function ProfileEditor({
  action,
  avatarBadgeLabel,
  avatarDescription,
  avatarTitle,
  formLabel,
  initialValues,
  savedLabel,
  secondaryAction,
  showSavedState,
  submitLabel,
  suggestions,
}: ProfileEditorProps) {
  const [avatarSelection, setAvatarSelection] = useState<ProfileAvatarSelection>({
    kind: initialValues.avatarKind,
    value: initialValues.avatarValue,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.84fr)_minmax(32rem,1.2fr)]">
      <AvatarPicker
        badgeLabel={avatarBadgeLabel}
        description={avatarDescription}
        googleAvatarUrl={initialValues.googleAvatarUrl}
        onAvatarChange={setAvatarSelection}
        selectedAvatar={avatarSelection}
        title={avatarTitle}
      />
      <ProfileFormSection
        action={action}
        avatarSelection={avatarSelection}
        formLabel={formLabel}
        initialValues={initialValues}
        savedLabel={savedLabel}
        secondaryAction={secondaryAction}
        showSavedState={showSavedState}
        submitLabel={submitLabel}
        suggestions={suggestions}
      />
    </div>
  );
}
