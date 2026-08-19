"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchUsAddresses, type AddressSuggestion } from "@/lib/mapbox/geocode";

type AddressAutocompleteInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  required?: boolean;
  placeholder?: string;
  invalid?: boolean;
};

export function AddressAutocompleteInput({
  value,
  onChange,
  onSelect,
  required,
  placeholder = "Start typing an address",
  invalid,
}: AddressAutocompleteInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const committedStreetRef = useRef<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (committedStreetRef.current !== null && value === committedStreetRef.current) {
      setOpen(false);
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (value.trim().length < 3) {
      setOpen(false);
      setSuggestions([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchUsAddresses(value, controller.signal)
        .then((results) => {
          if (committedStreetRef.current !== null && value === committedStreetRef.current) {
            setOpen(false);
            setSuggestions([]);
            return;
          }
          setSuggestions(results);
          setOpen(results.length > 0);
          setError(null);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setOpen(false);
          setError(err instanceof Error ? err.message : "Address lookup failed");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div className="address-autocomplete" ref={rootRef}>
      <input
        className={invalid ? "is-invalid" : undefined}
        value={value}
        onChange={(event) => {
          committedStreetRef.current = null;
          onChange(event.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        required={required}
        placeholder={placeholder}
        autoComplete="street-address"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
      />
      {loading ? <span className="address-autocomplete-status">Searching…</span> : null}
      {error ? <span className="address-autocomplete-status error">{error}</span> : null}
      {open && suggestions.length > 0 ? (
        <ul id={listId} className="address-autocomplete-list" role="listbox">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} role="option">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  committedStreetRef.current = suggestion.addressLine1;
                  onSelect(suggestion);
                  setOpen(false);
                  setSuggestions([]);
                }}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
