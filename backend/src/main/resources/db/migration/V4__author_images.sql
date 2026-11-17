-- Portrait image for every author. Files live in backend/src/main/resources/static/covers/authors,
-- served publicly under /covers/** like the book covers. Only fills authors that have no image yet.

UPDATE author
SET image_url = '/covers/authors/' || slug || '.svg'
WHERE image_url IS NULL;
