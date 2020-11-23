DROP FUNCTION IF EXISTS variants_select_submission_for_grading(bigint,boolean);
DROP FUNCTION IF EXISTS variants_select_submission_for_grading(bigint,bigint);

CREATE OR REPLACE FUNCTION
    variants_select_submission_for_grading (
        IN variant_id bigint,
        IN check_submission_id bigint DEFAULT NULL
    ) RETURNS TABLE (submission submissions)
AS $$
BEGIN
    PERFORM variants_lock(variant_id);

    -- start with the most recent submission
    SELECT s.*
    INTO submission
    FROM submissions AS s
    WHERE s.variant_id = variants_select_submission_for_grading.variant_id
    ORDER BY s.date DESC, s.id DESC
    LIMIT 1;

    IF NOT FOUND THEN RETURN; END IF; -- no submissions

    IF check_submission_id IS NOT NULL and check_submission_id != submission.id THEN
        RAISE EXCEPTION 'check_submission_id mismatch: % vs %', check_submission_id, submission.id;
    END IF;

    -- does the most recent submission actually need grading?
    IF submission.broken THEN RETURN; END IF;
    IF NOT submission.gradable THEN RETURN; END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql VOLATILE;
