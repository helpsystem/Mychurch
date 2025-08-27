db.prepare(`INSERT INTO leaders (id, name, title, imageUrl) VALUES 
(1, 'Rev. Javad Pishghadamian', '{"en": "Senior Pastor", "fa": "کشیش ارشد"}', 'https://i.pravatar.cc/400?u=javad'),
(2, 'Nazi Rasti', '{"en": "Women''s Bible Study Leader", "fa": "رهبر مطالعه کتاب مقدس بانوان"}', 'https://i.pravatar.cc/400?u=nazi')`).run();
