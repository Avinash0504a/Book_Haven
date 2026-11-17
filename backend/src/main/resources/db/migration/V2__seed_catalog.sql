-- Seed catalogue: categories, brands, authors and books. Fixed slugs; no members, passwords,
-- orders or reviews. Runs once under Flyway and is safe to re-run (ON CONFLICT DO NOTHING).

-- categories (the sidebar of the home wireframe)
INSERT INTO category (name, slug, sort_order) VALUES
    ('Romance', 'romance', 1),
    ('Mystery', 'mystery', 2),
    ('Science Fiction', 'science-fiction', 3),
    ('Fantasy', 'fantasy', 4),
    ('Historical', 'historical', 5),
    ('Biography', 'biography', 6),
    ('Self-help', 'self-help', 7),
    ('Memoir', 'memoir', 8),
    ('Travel', 'travel', 9),
    ('Cooking', 'cooking', 10),
    ('Children''s', 'childrens', 11),
    ('Young Adult', 'young-adult', 12),
    ('Comics & Graphic Novels', 'comics-graphic-novels', 13),
    ('Poetry', 'poetry', 14),
    ('Drama', 'drama', 15),
    ('Science', 'science', 16),
    ('Philosophy', 'philosophy', 17),
    ('Religion', 'religion', 18),
    ('Language Learning', 'language-learning', 19)
ON CONFLICT (slug) DO NOTHING;

-- brands
INSERT INTO brand (name, slug) VALUES
    ('Lantern Press', 'lantern-press'),
    ('Maple Leaf Books', 'maple-leaf-books'),
    ('Banyan House', 'banyan-house'),
    ('Saffron Publishing', 'saffron-publishing'),
    ('Indigo Ink', 'indigo-ink'),
    ('Monsoon Media', 'monsoon-media')
ON CONFLICT (slug) DO NOTHING;

-- authors
INSERT INTO author (name, slug, bio) VALUES
    ('Arjun Patel', 'arjun-patel', 'Writes practical guides on focus and productivity.'),
    ('Raj Patel', 'raj-patel', 'Educator and author on lifelong learning.'),
    ('James Wright', 'james-wright', 'Writes about goals, habits and confidence.'),
    ('James Adams', 'james-adams', 'Author of atmospheric mysteries and thrillers.'),
    ('Jessica Martin', 'jessica-martin', 'Romance novelist with a taste for sweeping settings.'),
    ('Laura Mitchell', 'laura-mitchell', 'Science fiction writer inspired by space exploration.'),
    ('Daniel Reed', 'daniel-reed', 'Champion of simple living and clear thinking.'),
    ('Clara Nelson', 'clara-nelson', 'Writes chilling stories set in old houses.'),
    ('Emily Parker', 'emily-parker', 'Children''s author of animal adventures.'),
    ('Priya Nair', 'priya-nair', 'Writes warm stories of love and family.'),
    ('Vikram Rao', 'vikram-rao', 'Historian and storyteller of trade and travel.'),
    ('Ananya Iyer', 'ananya-iyer', 'Writes on history, ideas and everyday philosophy.'),
    ('Rohan Mehta', 'rohan-mehta', 'Travel writer and biographer.'),
    ('Meera Krishnan', 'meera-krishnan', 'Food writer collecting recipes and stories.'),
    ('Sanjay Kulkarni', 'sanjay-kulkarni', 'Retells classic epics for new readers.'),
    ('Kavya Reddy', 'kavya-reddy', 'Telugu novelist and playwright.'),
    ('Thomas Bennett', 'thomas-bennett', 'Science communicator and essayist.'),
    ('Sarah Collins', 'sarah-collins', 'Writes accessible science and personal essays.'),
    ('Oliver Grant', 'oliver-grant', 'Fantasy author of long, layered series.'),
    ('Neha Gupta', 'neha-gupta', 'Hindi poet and language teacher.'),
    ('Arvind Swamy', 'arvind-swamy', 'Kannada writer of memoir and mystery.'),
    ('Lakshmi Narayan', 'lakshmi-narayan', 'Tamil poet, storyteller and teacher.'),
    ('Daniel Brooks', 'daniel-brooks', 'Writes young adult fiction and graphic stories.'),
    ('Isha Verma', 'isha-verma', 'Hindi romance novelist.')
ON CONFLICT (slug) DO NOTHING;

-- books: slug, title, author, category, brand, format, language, price, discount %, stock,
--        sold count, description. Stock 0 means out of stock (always 0 for digital formats).
INSERT INTO book (slug, title, author_id, category_id, brand_id, format, language, price,
                  discount_percent, stock_quantity, base_sold_count, description, cover_image_url)
SELECT v.slug, v.title, a.id, c.id, b.id, v.format, v.language, v.price,
       v.discount, v.stock, v.sold, v.description, '/covers/' || v.slug || '.svg'
FROM (VALUES
    ('the-art-of-focus', 'The Art of Focus', 'arjun-patel', 'self-help', 'lantern-press', 'PAPERBACK', 'English', 399.00, 0, 40, 820, 'Practical guide to mastering focus and boosting productivity every day.'),
    ('the-art-of-learning', 'The Art of Learning', 'raj-patel', 'self-help', 'lantern-press', 'PAPERBACK', 'English', 259.00, 10, 35, 640, 'Master the mindset and methods for effective lifelong learning.'),
    ('the-path-to-success', 'The Path to Success', 'james-wright', 'self-help', 'maple-leaf-books', 'PAPERBACK', 'English', 359.00, 0, 25, 910, 'A practical guide to achieving goals with clarity and confidence.'),
    ('the-midnight-hour', 'The Midnight Hour', 'james-adams', 'mystery', 'maple-leaf-books', 'PAPERBACK', 'English', 299.00, 0, 50, 1500, 'Haunting tale of a man''s journey and the shadows of a forgotten past.'),
    ('beneath-the-stars', 'Beneath the Stars', 'jessica-martin', 'romance', 'banyan-house', 'HARDCOVER', 'English', 499.00, 15, 20, 1320, 'A heartwarming tale, where two souls discover who you need.'),
    ('the-final-frontier', 'The Final Frontier', 'laura-mitchell', 'science-fiction', 'banyan-house', 'PAPERBACK', 'English', 359.00, 0, 30, 870, 'A mission to space secrets to change humanity forever.'),
    ('joy-of-minimalism', 'Joy of Minimalism', 'daniel-reed', 'self-help', 'lantern-press', 'PAPERBACK', 'English', 149.00, 0, 60, 700, 'Declutter your life to uncover peace, clarity and joy.'),
    ('the-vanishing-house', 'The Vanishing House', 'clara-nelson', 'mystery', 'indigo-ink', 'EBOOK', 'English', 99.00, 0, 0, 560, 'A chilling mystery unfolds within a house that disappears.'),
    ('the-lost-kitten', 'The Lost Kitten', 'emily-parker', 'childrens', 'indigo-ink', 'HARDCOVER', 'English', 339.00, 20, 15, 480, 'A heartwarming tale of courage, friendship and feline adventure.'),
    ('monsoon-letters', 'Monsoon Letters', 'priya-nair', 'romance', 'saffron-publishing', 'PAPERBACK', 'English', 275.00, 0, 22, 390, 'Two strangers, one rainy season and a bundle of unsent letters.'),
    ('the-spice-route', 'The Spice Route', 'vikram-rao', 'historical', 'saffron-publishing', 'HARDCOVER', 'English', 649.00, 10, 12, 310, 'Merchants, sailors and the roads that carried flavour across the world.'),
    ('temple-of-time', 'Temple of Time', 'ananya-iyer', 'historical', 'saffron-publishing', 'PAPERBACK', 'Tamil', 320.00, 0, 18, 260, 'The story of a temple city and the families who built it.'),
    ('kitchen-stories', 'Kitchen Stories', 'meera-krishnan', 'cooking', 'banyan-house', 'HARDCOVER', 'English', 899.00, 25, 8, 240, 'Family recipes from across India, with the stories behind each dish.'),
    ('the-quiet-summit', 'The Quiet Summit', 'rohan-mehta', 'travel', 'monsoon-media', 'PAPERBACK', 'English', 449.00, 0, 0, 180, 'A slow walk through the Himalayas and what the silence teaches.'),
    ('ghat-par-subah', 'Ghat Par Subah', 'neha-gupta', 'poetry', 'saffron-publishing', 'PAPERBACK', 'Hindi', 199.00, 0, 45, 350, 'Poems of dawn, rivers and small city moments.'),
    ('saat-kadam', 'Saat Kadam', 'isha-verma', 'romance', 'banyan-house', 'PAPERBACK', 'Hindi', 249.00, 5, 30, 420, 'A love story told over seven steps and seven seasons.'),
    ('mahabharat-ki-kahaniyan', 'Mahabharat Ki Kahaniyan', 'sanjay-kulkarni', 'religion', 'saffron-publishing', 'EBOOK', 'Hindi', 129.00, 0, 0, 610, 'Stories from the epic, retold simply for every reader.'),
    ('nila-mazhai', 'Nila Mazhai', 'lakshmi-narayan', 'poetry', 'monsoon-media', 'PAPERBACK', 'Tamil', 229.00, 0, 27, 200, 'Verses on moonlight, rain and memory.'),
    ('kadal-kathai', 'Kadal Kathai', 'lakshmi-narayan', 'childrens', 'monsoon-media', 'AUDIOBOOK', 'Tamil', 179.00, 0, 0, 150, 'Bedtime tales from the sea, narrated for young listeners.'),
    ('vennela-rathri', 'Vennela Rathri', 'kavya-reddy', 'romance', 'indigo-ink', 'PAPERBACK', 'Telugu', 259.00, 0, 20, 330, 'A moonlit romance set in a quiet coastal town.'),
    ('maa-ooru-katha', 'Maa Ooru Katha', 'kavya-reddy', 'drama', 'indigo-ink', 'EBOOK', 'Telugu', 119.00, 0, 0, 220, 'A village, its secrets and the family at the centre of them.'),
    ('malenaadu-dinagalu', 'Malenaadu Dinagalu', 'arvind-swamy', 'memoir', 'monsoon-media', 'PAPERBACK', 'Kannada', 289.00, 0, 16, 190, 'Memories of growing up in the Western Ghats.'),
    ('kaadina-rahasya', 'Kaadina Rahasya', 'arvind-swamy', 'mystery', 'monsoon-media', 'AUDIOBOOK', 'Kannada', 199.00, 10, 0, 140, 'A forest, a missing guide and a mystery that unfolds by ear.'),
    ('beyond-the-atom', 'Beyond the Atom', 'thomas-bennett', 'science', 'lantern-press', 'HARDCOVER', 'English', 799.00, 0, 10, 270, 'A clear tour of modern physics for curious readers.'),
    ('cosmos-for-curious-minds', 'Cosmos for Curious Minds', 'sarah-collins', 'science', 'lantern-press', 'EBOOK', 'English', 249.00, 0, 0, 430, 'Stars, planets and the questions that keep astronomers awake.'),
    ('the-dragons-ledger', 'The Dragon''s Ledger', 'oliver-grant', 'fantasy', 'maple-leaf-books', 'PAPERBACK', 'English', 399.00, 0, 0, 1100, 'An accountant, a dragon and a debt that spans kingdoms.'),
    ('ember-and-ash', 'Ember and Ash', 'oliver-grant', 'fantasy', 'maple-leaf-books', 'AUDIOBOOK', 'English', 349.00, 15, 0, 760, 'A war of fire and shadow, performed by a full cast.'),
    ('the-last-lighthouse', 'The Last Lighthouse', 'daniel-brooks', 'young-adult', 'indigo-ink', 'PAPERBACK', 'English', 279.00, 0, 33, 520, 'Three friends, one summer and a lighthouse that should not exist.'),
    ('graphic-city', 'Graphic City', 'daniel-brooks', 'comics-graphic-novels', 'monsoon-media', 'PAPERBACK', 'English', 599.00, 20, 14, 290, 'A graphic novel of a city that redraws itself every night.'),
    ('letters-to-myself', 'Letters to Myself', 'sarah-collins', 'memoir', 'banyan-house', 'EBOOK', 'English', 149.00, 0, 0, 360, 'Honest essays on change, written as letters across the years.'),
    ('stoic-mornings', 'Stoic Mornings', 'thomas-bennett', 'philosophy', 'lantern-press', 'PAPERBACK', 'English', 329.00, 0, 28, 610, 'Short morning readings on calm, courage and choice.'),
    ('the-examined-life', 'The Examined Life', 'ananya-iyer', 'philosophy', 'saffron-publishing', 'HARDCOVER', 'English', 549.00, 10, 9, 230, 'Big questions asked gently, with examples from daily life.'),
    ('speak-hindi-in-30-days', 'Speak Hindi in 30 Days', 'neha-gupta', 'language-learning', 'monsoon-media', 'PAPERBACK', 'English', 219.00, 0, 55, 480, 'A thirty-day plan with phrases, pronunciation and practice.'),
    ('learn-tamil-by-listening', 'Learn Tamil by Listening', 'lakshmi-narayan', 'language-learning', 'monsoon-media', 'AUDIOBOOK', 'English', 299.00, 0, 0, 170, 'Everyday Tamil taught through short spoken lessons.'),
    ('stage-lights', 'Stage Lights', 'priya-nair', 'drama', 'banyan-house', 'PAPERBACK', 'English', 259.00, 0, 19, 210, 'Three short plays about families, ambition and the theatre.'),
    ('lives-of-great-scientists', 'Lives of Great Scientists', 'rohan-mehta', 'biography', 'lantern-press', 'HARDCOVER', 'English', 699.00, 15, 11, 340, 'Portraits of scientists and the obstacles they overcame.')
) AS v(slug, title, author, category, brand, format, language, price, discount, stock, sold, description)
JOIN author   a ON a.slug = v.author
JOIN category c ON c.slug = v.category
JOIN brand    b ON b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;
