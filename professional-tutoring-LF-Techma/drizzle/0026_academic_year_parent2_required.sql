DO $$
DECLARE
  form_definition_id uuid;
  published_version record;
  parent2_required_path text[];
  updated_content jsonb;
  next_version_number integer;
  new_version_id uuid;
BEGIN
  SELECT id
  INTO form_definition_id
  FROM public_form_definitions
  WHERE form_key = 'academic_year_tutoring'
  LIMIT 1;

  IF form_definition_id IS NULL THEN
    RETURN;
  END IF;

  SELECT *
  INTO published_version
  FROM public_form_versions
  WHERE definition_id = form_definition_id
    AND status = 'published'
  ORDER BY version_number DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT ARRAY[
    'steps',
    (step_item.ordinality - 1)::text,
    'fields',
    (field_item.ordinality - 1)::text,
    'required'
  ]
  INTO parent2_required_path
  FROM jsonb_array_elements(published_version.content->'steps') WITH ORDINALITY AS step_item(value, ordinality)
  CROSS JOIN LATERAL jsonb_array_elements(step_item.value->'fields') WITH ORDINALITY AS field_item(value, ordinality)
  WHERE step_item.value->>'key' = 'contacts'
    AND field_item.value->>'id' = 'parent2_contact'
  LIMIT 1;

  IF parent2_required_path IS NULL THEN
    RETURN;
  END IF;

  updated_content := jsonb_set(published_version.content, parent2_required_path, 'true'::jsonb, false);
  IF updated_content = published_version.content THEN
    RETURN;
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version_number
  FROM public_form_versions
  WHERE definition_id = form_definition_id;

  UPDATE public_form_versions
  SET status = 'retired',
      retired_at = now()
  WHERE id = published_version.id;

  INSERT INTO public_form_versions (
    definition_id,
    version_number,
    status,
    content,
    change_reason,
    published_at
  )
  VALUES (
    form_definition_id,
    next_version_number,
    'published',
    updated_content,
    'Required Parent 2 contact compatibility update',
    now()
  )
  RETURNING id INTO new_version_id;

  INSERT INTO public_form_audit_events (
    definition_id,
    version_id,
    action,
    reason,
    metadata
  )
  VALUES (
    form_definition_id,
    new_version_id,
    'compatibility_published',
    'Required Parent 2 contact compatibility update',
    jsonb_build_object('sourceVersionId', published_version.id)
  );

  UPDATE public_form_definitions
  SET updated_at = now()
  WHERE id = form_definition_id;
END $$;