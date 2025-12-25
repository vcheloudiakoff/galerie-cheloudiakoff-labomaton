-- Demo seed data for Galerie Cheloudiakoff
-- This file creates sample artists, artworks, events, and posts

-- Demo Artists
INSERT INTO artists (id, name, slug, bio_md, published, published_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'Marie Duval', 'marie-duval',
'Marie Duval est une artiste peintre francaise nee en 1985 a Lyon. Son travail explore les frontieres entre abstraction et figuration, avec une palette de couleurs vibrantes et une gestuelle expressive.

Formee aux Beaux-Arts de Lyon, elle a expose dans de nombreuses galeries en France et en Europe. Ses oeuvres font partie de plusieurs collections privees.

## Demarche artistique

Son travail questionne notre rapport a la nature et a l''environnement urbain, creant des paysages oniriques ou se melent elements naturels et constructions humaines.',
true, NOW()),

('a2222222-2222-2222-2222-222222222222', 'Thomas Bernard', 'thomas-bernard',
'Thomas Bernard est un sculpteur contemporain installe en Normandie. Ses sculptures en metal et bois explores les tensions entre organique et industriel.

Apres des etudes d''architecture, il s''est tourne vers la sculpture monumentale. Ses oeuvres sont presentes dans plusieurs espaces publics en France.',
true, NOW()),

('a3333333-3333-3333-3333-333333333333', 'Sophie Laurent', 'sophie-laurent',
'Sophie Laurent pratique la photographie et l''installation video. Son travail interroge la memoire collective et l''identite a travers des portraits et des paysages.

Elle a recu le Prix de la Jeune Creation en 2020 et expose regulierement a l''international.',
true, NOW());

-- Demo Artworks
INSERT INTO artworks (id, artist_id, title, slug, year, medium, dimensions, artsper_url, published, published_at) VALUES
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
'Horizon Bleu', 'horizon-bleu', 2023, 'Huile sur toile', '120 x 80 cm',
'https://www.artsper.com', true, NOW()),

('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111',
'Foret Interieure', 'foret-interieure', 2024, 'Acrylique et collage sur toile', '100 x 100 cm',
'https://www.artsper.com', true, NOW()),

('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111',
'Memoire d''Eau', 'memoire-d-eau', 2024, 'Technique mixte', '150 x 100 cm',
NULL, true, NOW()),

('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222',
'Structure III', 'structure-iii', 2023, 'Acier corten et chene', '200 x 80 x 80 cm',
'https://www.artsper.com', true, NOW()),

('b5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222',
'Equilibre', 'equilibre', 2024, 'Bronze', '60 x 40 x 30 cm',
'https://www.artsper.com', true, NOW()),

('b6666666-6666-6666-6666-666666666666', 'a3333333-3333-3333-3333-333333333333',
'Traces', 'traces', 2024, 'Photographie numerique', '80 x 120 cm',
NULL, true, NOW());

-- Demo Events
INSERT INTO events (id, title, slug, start_at, end_at, location, description_md, published, published_at) VALUES
('c1111111-1111-1111-1111-111111111111', 'Exposition Marie Duval - Paysages Interieurs',
'exposition-marie-duval-paysages-interieurs',
NOW() - INTERVAL '10 days', NOW() + INTERVAL '30 days',
'Galerie Cheloudiakoff, Paris',
'## Paysages Interieurs

La Galerie Cheloudiakoff est heureuse de presenter la nouvelle exposition de **Marie Duval**, artiste peintre dont le travail explore les frontieres entre abstraction et figuration.

### A propos de l''exposition

Cette exposition reunit une vingtaine d''oeuvres recentes, toutes realisees entre 2023 et 2024. Marie Duval nous invite a un voyage au coeur de paysages oniriques, ou la nature se mele a l''imaginaire.

### Vernissage

Un vernissage en presence de l''artiste aura lieu le premier samedi de l''exposition a partir de 18h.

*Entree libre*',
true, NOW()),

('c2222222-2222-2222-2222-222222222222', 'Nocturne - Rencontre avec Thomas Bernard',
'nocturne-rencontre-thomas-bernard',
NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days',
'Galerie Cheloudiakoff, Paris',
'## Nocturne speciale

A l''occasion des Nocturnes des galeries, venez rencontrer le sculpteur **Thomas Bernard** qui presentera son processus de creation.

La soiree sera accompagnee d''un cocktail.',
true, NOW());

-- Link events to artists
INSERT INTO event_artists (event_id, artist_id) VALUES
('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
('c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222');

-- Demo Posts
INSERT INTO posts (id, title, slug, body_md, published, published_at) VALUES
('d1111111-1111-1111-1111-111111111111', 'Ouverture de la nouvelle saison 2024',
'ouverture-nouvelle-saison-2024',
'La Galerie Cheloudiakoff est heureuse de vous annoncer l''ouverture de sa nouvelle saison 2024 !

## Au programme

Cette annee, nous avons le plaisir de vous presenter plusieurs expositions exceptionnelles :

- **Janvier - Mars** : Marie Duval - Paysages Interieurs
- **Avril - Juin** : Sculptures de Thomas Bernard
- **Septembre - Novembre** : Sophie Laurent - Memoires

## Nouveaute : Labomaton

Nous sommes egalement ravis de vous annoncer le lancement prochain de **Labomaton**, notre nouveau service d''impression photo haut de gamme. Inscrivez-vous a la liste d''attente sur notre site !

A tres bientot a la galerie.',
true, NOW() - INTERVAL '5 days'),

('d2222222-2222-2222-2222-222222222222', 'Interview de Marie Duval',
'interview-marie-duval',
'A l''occasion de son exposition "Paysages Interieurs", nous avons rencontre Marie Duval pour discuter de son travail et de sa demarche artistique.

## Comment est nee cette serie ?

> Ces paysages sont nes d''une periode de questionnement sur ma relation a la nature. J''ai commence a peindre des fragments de souvenirs, des impressions plutot que des representations fideles.

## Quelles sont vos influences ?

> Je suis tres influencee par les impressionnistes, evidemment, mais aussi par des artistes contemporains comme Gerhard Richter ou Peter Doig.

## Un conseil pour les jeunes artistes ?

> Travaillez tous les jours, meme un peu. Et n''ayez pas peur d''experimenter.

*L''exposition est visible jusqu''a fin janvier.*',
true, NOW() - INTERVAL '2 days');
