-- More catalogue rows so every category has at least three books, and every language and
-- format has at least three. Fixed slugs; safe to re-run (ON CONFLICT DO NOTHING).
-- Cover images are /covers/<slug>.svg under backend/src/main/resources/static/covers.

INSERT INTO author (name, slug, bio) VALUES
    ('Nikhil Sharma', 'nikhil-sharma', 'Science fiction writer of quiet, claustrophobic space stories.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO book (slug, title, author_id, category_id, brand_id, format, language, price,
                  discount_percent, stock_quantity, base_sold_count, description, cover_image_url)
SELECT v.slug, v.title, a.id, c.id, b.id, v.format, v.language, v.price,
       v.discount, v.stock, v.sold, v.description, '/covers/' || v.slug || '.svg'
FROM (VALUES
    ('orbit-of-silence', 'Orbit of Silence', 'nikhil-sharma', 'science-fiction', 'banyan-house', 'PAPERBACK', 'English', 329.00, 0, 24, 410, 'A lone engineer, a silent station and a signal that should not exist.'),
    ('the-glass-colony', 'The Glass Colony', 'laura-mitchell', 'science-fiction', 'lantern-press', 'EBOOK', 'English', 179.00, 10, 0, 380, 'Life under a dome on Mars, and the rumour that the sky is a lie.'),
    ('the-ninth-gate', 'The Ninth Gate', 'oliver-grant', 'fantasy', 'maple-leaf-books', 'HARDCOVER', 'English', 599.00, 10, 13, 540, 'Eight gates have fallen. A reluctant mapmaker must find the ninth.'),
    ('the-merchant-of-muziris', 'The Merchant of Muziris', 'vikram-rao', 'historical', 'saffron-publishing', 'PAPERBACK', 'English', 379.00, 0, 17, 230, 'A pepper trader, a Roman ship and a harbour at the edge of the world.'),
    ('andhra-veerulu', 'Andhra Veerulu', 'kavya-reddy', 'historical', 'indigo-ink', 'PAPERBACK', 'Telugu', 289.00, 0, 21, 175, 'Tales of the warriors and poets who shaped the Telugu country.'),
    ('the-man-who-measured-rivers', 'The Man Who Measured Rivers', 'rohan-mehta', 'biography', 'lantern-press', 'HARDCOVER', 'English', 649.00, 10, 10, 205, 'The life of an engineer who mapped the rivers of a young nation.'),
    ('a-teachers-journey', 'A Teacher''s Journey', 'raj-patel', 'biography', 'banyan-house', 'EBOOK', 'English', 159.00, 0, 0, 260, 'From a village classroom to a lifetime of changing how children learn.'),
    ('the-year-i-walked-home', 'The Year I Walked Home', 'priya-nair', 'memoir', 'indigo-ink', 'PAPERBACK', 'English', 299.00, 0, 26, 190, 'A year of long walks, short rests and the people met along the road.'),
    ('coastline-diaries', 'Coastline Diaries', 'rohan-mehta', 'travel', 'monsoon-media', 'PAPERBACK', 'English', 399.00, 0, 18, 210, 'Fishing villages, lighthouses and chai stalls from Kutch to Kanyakumari.'),
    ('trains-of-india', 'Trains of India', 'vikram-rao', 'travel', 'saffron-publishing', 'HARDCOVER', 'English', 799.00, 15, 9, 320, 'Ten great rail journeys and the people who ride them every day.'),
    ('the-masala-dabba', 'The Masala Dabba', 'meera-krishnan', 'cooking', 'banyan-house', 'PAPERBACK', 'English', 349.00, 0, 25, 380, 'Twenty spices, one steel box and a hundred weeknight dishes.'),
    ('sweet-endings', 'Sweet Endings', 'meera-krishnan', 'cooking', 'saffron-publishing', 'EBOOK', 'English', 149.00, 0, 0, 150, 'Festival sweets and everyday puddings, with step-by-step notes.'),
    ('the-moon-and-the-mango-tree', 'The Moon and the Mango Tree', 'emily-parker', 'childrens', 'indigo-ink', 'PAPERBACK', 'English', 249.00, 0, 30, 300, 'A curious squirrel climbs to ask the moon one big question.'),
    ('summer-of-paper-planes', 'Summer of Paper Planes', 'daniel-brooks', 'young-adult', 'maple-leaf-books', 'PAPERBACK', 'English', 269.00, 0, 28, 240, 'Two rivals, one rooftop and a contest that changes everything.'),
    ('the-hostel-club', 'The Hostel Club', 'isha-verma', 'young-adult', 'banyan-house', 'EBOOK', 'English', 129.00, 0, 0, 200, 'Five first-years, one leaky hostel and the club that holds them together.'),
    ('robot-in-the-rain', 'Robot in the Rain', 'daniel-brooks', 'comics-graphic-novels', 'monsoon-media', 'PAPERBACK', 'English', 499.00, 10, 12, 180, 'A wordless graphic story of a robot that learns what rain is.'),
    ('the-tiger-of-tadoba', 'The Tiger of Tadoba', 'sanjay-kulkarni', 'comics-graphic-novels', 'saffron-publishing', 'HARDCOVER', 'English', 699.00, 0, 8, 120, 'A forest ranger and a tiger cub, told in full-colour panels.'),
    ('male-haadu', 'Male Haadu', 'arvind-swamy', 'poetry', 'monsoon-media', 'PAPERBACK', 'Kannada', 219.00, 0, 19, 130, 'Kannada verses on monsoon clouds, markets and midnight trains.'),
    ('the-last-act', 'The Last Act', 'priya-nair', 'drama', 'banyan-house', 'PAPERBACK', 'English', 279.00, 0, 15, 160, 'A theatre company, one final show and everything left unsaid.'),
    ('the-secret-life-of-plants', 'The Secret Life of Plants', 'sarah-collins', 'science', 'lantern-press', 'PAPERBACK', 'English', 349.00, 0, 20, 290, 'How trees talk, flowers keep time and roots make decisions.'),
    ('small-questions', 'Small Questions', 'ananya-iyer', 'philosophy', 'saffron-publishing', 'EBOOK', 'English', 139.00, 0, 0, 170, 'Thirty everyday puzzles that turn out to be philosophy.'),
    ('the-upanishads-simply', 'The Upanishads, Simply', 'sanjay-kulkarni', 'religion', 'saffron-publishing', 'PAPERBACK', 'English', 299.00, 0, 22, 310, 'Core ideas of the Upanishads in plain, readable prose.'),
    ('gita-saar', 'Gita Saar', 'sanjay-kulkarni', 'religion', 'saffron-publishing', 'AUDIOBOOK', 'Hindi', 149.00, 0, 0, 280, 'The essence of the Gita, narrated chapter by chapter in Hindi.'),
    ('learn-telugu-in-30-days', 'Learn Telugu in 30 Days', 'kavya-reddy', 'language-learning', 'monsoon-media', 'PAPERBACK', 'English', 229.00, 0, 35, 200, 'A thirty-day plan for reading and speaking everyday Telugu.')
) AS v(slug, title, author, category, brand, format, language, price, discount, stock, sold, description)
JOIN author   a ON a.slug = v.author
JOIN category c ON c.slug = v.category
JOIN brand    b ON b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;
