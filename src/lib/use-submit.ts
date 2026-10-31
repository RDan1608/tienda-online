"use client";

import { useTransition } from "react";

/**
 * Envía el <form> a una Server Action SIN el reinicio automático de React 19.
 * Con `<form action={fn}>` React vacía los campos al terminar; si hubo un error
 * de validación el usuario perdería lo que escribió.
 */
export function useSubmit(action: (formData: FormData) => void) {
  const [, startTransition] = useTransition();

  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(e.currentTarget, submitter);
    startTransition(() => action(formData));
  };
}
