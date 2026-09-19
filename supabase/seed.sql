-- ════════════════════════════════════════════════════════════════
--  TH-INK — seed data
--  Run AFTER schema.sql.
--
--  Creates 7 demo writers. They all share the password:  think1234
--  Sign in as  sarah@think.app / think1234  for the fullest account.
-- ════════════════════════════════════════════════════════════════

-- Re-runnable: remove the demo rows first (cascades to everything below).
delete from auth.users where id in ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000007');

-- ─────────────────────────── demo auth users ───────────────────────────
-- crypt() comes from pgcrypto, enabled in schema.sql.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000001', 'authenticated', 'authenticated',
  'sarah@think.app', crypt('think1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Sarah Chen"}'::jsonb, now(), now()
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000001', 'email',
  '{"sub":"00000000-0000-4000-a000-000000000001","email":"sarah@think.app","email_verified":true}'::jsonb, now(), now());
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000002', 'authenticated', 'authenticated',
  'marcus@think.app', crypt('think1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Marcus Reid"}'::jsonb, now(), now()
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000002', 'email',
  '{"sub":"00000000-0000-4000-a000-000000000002","email":"marcus@think.app","email_verified":true}'::jsonb, now(), now());
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000003', 'authenticated', 'authenticated',
  'lena@think.app', crypt('think1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Lena Torres"}'::jsonb, now(), now()
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000003', 'email',
  '{"sub":"00000000-0000-4000-a000-000000000003","email":"lena@think.app","email_verified":true}'::jsonb, now(), now());
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000004', 'authenticated', 'authenticated',
  'aisha@think.app', crypt('think1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Aisha Patel"}'::jsonb, now(), now()
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000004', 'email',
  '{"sub":"00000000-0000-4000-a000-000000000004","email":"aisha@think.app","email_verified":true}'::jsonb, now(), now());
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000005', 'authenticated', 'authenticated',
  'james@think.app', crypt('think1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"James Wu"}'::jsonb, now(), now()
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000005', 'email',
  '{"sub":"00000000-0000-4000-a000-000000000005","email":"james@think.app","email_verified":true}'::jsonb, now(), now());
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000006', 'authenticated', 'authenticated',
  'david@think.app', crypt('think1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"David Kim"}'::jsonb, now(), now()
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000006', 'email',
  '{"sub":"00000000-0000-4000-a000-000000000006","email":"david@think.app","email_verified":true}'::jsonb, now(), now());
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000007', 'authenticated', 'authenticated',
  'sophie@think.app', crypt('think1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Sophie Clark"}'::jsonb, now(), now()
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000007', 'email',
  '{"sub":"00000000-0000-4000-a000-000000000007","email":"sophie@think.app","email_verified":true}'::jsonb, now(), now());

-- ─────────────────────────── profiles ───────────────────────────
-- The on_auth_user_created trigger already made a bare row; enrich it here.
update public.profiles set
  handle='sarahchen', name='Sarah Chen', bio='Writing about attention, memory and the small things that hold a life together.', initials='SC',
  avatar_bg='#f5f0d8', avatar_color='#a07818', location='Lisbon, Portugal',
  topics=array['Philosophy','Writing','Memory & Place']::text[],
  craft_score=91, streak_days=12
where id='00000000-0000-4000-a000-000000000001';
update public.profiles set
  handle='marcusreid', name='Marcus Reid', bio='Writing at the intersection of philosophy and everyday life.', initials='MR',
  avatar_bg='#dff0e8', avatar_color='#3a8c60', location='Edinburgh, UK',
  topics=array['Philosophy','Mindfulness']::text[],
  craft_score=88, streak_days=31
where id='00000000-0000-4000-a000-000000000002';
update public.profiles set
  handle='lenatorres', name='Lena Torres', bio='Memory, place, and the architecture of the self.', initials='LT',
  avatar_bg='#ecdff5', avatar_color='#8040b0', location='Mexico City',
  topics=array['Psychology','Memory & Place']::text[],
  craft_score=84, streak_days=7
where id='00000000-0000-4000-a000-000000000003';
update public.profiles set
  handle='aishapatel', name='Aisha Patel', bio='Essays on language, belonging, and the in-between.', initials='AP',
  avatar_bg='#dde8f5', avatar_color='#2860a0', location='Toronto, Canada',
  topics=array['Essays','Language']::text[],
  craft_score=86, streak_days=19
where id='00000000-0000-4000-a000-000000000004';
update public.profiles set
  handle='jameswu', name='James Wu', bio='Science writing for the curious and the bewildered.', initials='JW',
  avatar_bg='#f5f0d8', avatar_color='#a07818', location='Singapore',
  topics=array['Science','Writing']::text[],
  craft_score=79, streak_days=4
where id='00000000-0000-4000-a000-000000000005';
update public.profiles set
  handle='davidkim', name='David Kim', bio='Cultural criticism without the jargon.', initials='DK',
  avatar_bg='#f5dede', avatar_color='#a03030', location='Seoul, South Korea',
  topics=array['Culture','Essays']::text[],
  craft_score=81, streak_days=9
where id='00000000-0000-4000-a000-000000000006';
update public.profiles set
  handle='sophieclark', name='Sophie Clark', bio='Fiction and the real world have more in common than you think.', initials='SC',
  avatar_bg='#d8f0e8', avatar_color='#208050', location='Dublin, Ireland',
  topics=array['Fiction','Poetry']::text[],
  craft_score=77, streak_days=2
where id='00000000-0000-4000-a000-000000000007';

-- ─────────────────────────── articles ───────────────────────────
-- Bodies are carried over verbatim from the original prototype.
insert into public.articles (id, author_id, title, subtitle, body, tag, form, cover_grad, cover_accent, read_time, word_count, status, published_at)
values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000005', 'Writing in the Dark', 'On creative blocks, the blank page, and why the hardest sentence is always the first', '<p>There is a particular terror in the blank page that no writer ever fully escapes. Even after years of practice, even with a clear idea in your head, there is something in the act of beginning that resists — as if the white space has its own gravity, its own preference for remaining undisturbed.</p>
<p>I used to think this resistance was a sign of inadequacy. That real writers didn''t stall. That somewhere, there were people who simply opened their laptops and began, sentences arriving in clean, confident rows. I spent years trying to become that person.</p>
<p>Now I think the resistance is the work. The pause before you begin isn''t empty — it''s full. It contains every version of the piece that could exist, every possible first sentence, every way the thing could go wrong. To write the first sentence is to collapse all those possibilities into one. It''s an act of commitment, and commitment is frightening.</p>
<p>The way I learned to move through it was small: don''t try to write the piece. Write the next sentence. Just the next one. The piece doesn''t exist yet — it doesn''t need to be perfect, because it isn''t a piece yet. It''s just a sentence. And you can write a sentence.</p>
<p>The blank page, it turns out, is afraid of something too. It''s afraid of you starting. Once you start, it loses.</p>',
  'Writing', 'Essay', 'linear-gradient(135deg,#1e1810,#3a2518)', 'rgba(200,98,10,.35)', '5 min',
  230, 'published', now() - interval '3 days');
insert into public.articles (id, author_id, title, subtitle, body, tag, form, cover_grad, cover_accent, read_time, word_count, status, published_at)
values ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002', 'On Silence and the Art of Listening', 'What we learn when we stop trying to fill every moment with words', '<p>Most of us experience silence as absence — the absence of conversation, music, notification, news. We fill it instinctively, reaching for our phones the moment we''re alone on an elevator, turning on a podcast the moment we start cooking. We have become so accustomed to background noise that silence feels like something has gone wrong.</p>
<p>But there is another kind of silence — not absence, but presence. The silence of a forest in the hour before dawn. The silence between two people who trust each other completely. The silence that falls after you have said the thing you most needed to say.</p>
<p>Philosophers have known about this distinction for centuries. John Cage built an entire aesthetic around it. Quakers have made it the center of their spiritual practice. But you don''t need theology or avant-garde music to experience it — you just need to stop, and wait, and let the quality of quiet reveal itself.</p>
<p>I started sitting in silence for twenty minutes each morning about three years ago. I expected it to be calming. What I didn''t expect was what I began to hear: the difference between thinking and noticing. The sound my own breathing makes. The way thoughts arrive, announce themselves, and leave if you don''t grab onto them.</p>
<p>Silence, it turns out, is one of the most informative things there is. It just requires you to listen in a different way.</p>',
  'Mindfulness', 'Essay', 'linear-gradient(135deg,#0f1a1a,#1a2e28)', 'rgba(45,140,88,.3)', '7 min',
  234, 'published', now() - interval '4 days');
insert into public.articles (id, author_id, title, subtitle, body, tag, form, cover_grad, cover_accent, read_time, word_count, status, published_at)
values ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000006', 'Against Productivity Culture', 'Why the obsession with output has made us efficient at the wrong things', '<p>We have made productivity into a moral virtue. Not efficiency, exactly — efficiency was always respectable, a way of getting more done in less time. Productivity is something different: a framework in which the point of being alive is to produce, and your worth is measured by your output.</p>
<p>This isn''t a small cultural shift. It changes what we value, what we''re ashamed of, how we spend our leisure time. If you read for pleasure, you half-feel you should be reading something useful. If you walk for an hour without a podcast, you wonder if you''ve wasted it. Rest, once considered essential, has become something you have to earn.</p>
<p>The productivity influencer will tell you that rest is fine — it makes you more productive. Sleep is good because it improves your performance. Exercise is non-negotiable because it boosts your output. Even vacation is justified by how refreshed it makes you at work. Everything circles back to production.</p>
<p>What''s lost in this framing is any account of why production matters. Productive for what? Efficient toward what end? The system has swallowed its own justification. We work to be able to work better.</p>
<p>I am not arguing for idleness. I am arguing for purpose. The question is not how much you produce, but what you are producing, and whether it is worth producing. That''s a question no productivity system can answer for you.</p>',
  'Culture', 'Essay', 'linear-gradient(135deg,#181010,#2a1010)', 'rgba(201,48,80,.28)', '6 min',
  232, 'published', now() - interval '5 days');
insert into public.articles (id, author_id, title, subtitle, body, tag, form, cover_grad, cover_accent, read_time, word_count, status, published_at)
values ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000003', 'The Architecture of Memory', 'How we build our sense of self from fragments we choose to keep', '<p>Memory is not storage. This is the first thing cognitive science asks you to understand, and the one most of us resist hardest. We think of our memories as records — faithful archives of what happened, retrievable on demand. But memory is reconstruction. Every time you remember something, you rebuild it, and the rebuilding changes it.</p>
<p>This is not a flaw. It is a feature, and a profound one. The self you carry with you is not the fixed sum of everything that happened to you. It is the story you''ve assembled from the things you chose to keep, reshaped every time you return to them. Memory is identity in motion.</p>
<p>I find this both terrifying and liberating. Terrifying because it means nothing is preserved exactly as it was — the sharp edges of experience are worn smooth by retelling. Liberating because it means we are not simply prisoners of our pasts. The narrative is still being written.</p>
<p>Certain memories become load-bearing. They hold the structure of the self up. The moment you realized you were brave, or the moment you realized you weren''t. The conversation that changed how you thought about love. The grief that reorganized everything around it. These aren''t just things that happened — they are the pillars of your particular architecture.</p>',
  'Psychology', 'Essay', 'linear-gradient(135deg,#1a0f20,#2a1438)', 'rgba(100,72,176,.3)', '8 min',
  215, 'published', now() - interval '6 days');
insert into public.articles (id, author_id, title, subtitle, body, tag, form, cover_grad, cover_accent, read_time, word_count, status, published_at)
values ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000004', 'The Distance Between Stars', 'Loneliness is not the absence of people — it''s the absence of meaning in connection', '<p>You can be surrounded by people and feel entirely alone. This is one of modernity''s most confusing experiences — to have more connection than any previous generation in history, and to feel, somehow, further from others than ever.</p>
<p>The usual explanation is that digital connection is shallow. That we scroll instead of speak, that we perform connection instead of experiencing it. There''s truth in this, but I don''t think it''s the whole story. The problem isn''t the medium. The problem is meaning.</p>
<p>Loneliness isn''t the absence of people. It''s the absence of people who see you — who hold the same version of you that you hold of yourself, who respond to what you''re actually saying rather than what they expected you to say. It''s the gap between the self you present and the self you know.</p>
<p>I spent a long time thinking this gap was my problem to solve — that if I were better at expressing myself, or more likable, or more open, the loneliness would lift. What I''ve come to believe instead is that the gap is irreducible. We are, finally, interior creatures, and no amount of conversation fully crosses the distance.</p>
<p>What changes is not the distance but your relationship to it. Learning to find the small, bright moments of genuine contact — and to carry them carefully — is, I think, what closeness actually means.</p>',
  'Essays', 'Essay', 'linear-gradient(135deg,#0e1820,#0e1c28)', 'rgba(36,112,184,.3)', '7 min',
  230, 'published', now() - interval '8 days');
insert into public.articles (id, author_id, title, subtitle, body, tag, form, cover_grad, cover_accent, read_time, word_count, status, published_at)
values ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000001', 'The Path Less Traveled', 'A meditation on choices, courage, and the beauty of uncertainty', '<p>Every path not taken exists somewhere. This is the strange comfort and torment of choice — that the life you didn''t live is still, in some sense, living. The version of you who said yes when you said no, who stayed when you left, who left when you stayed, persists in possibility even as your actual self moves forward through actual time.</p>
<p>Robert Frost knew this. His famous poem is often misread as a celebration of nonconformity — taking the road less traveled, being different, being brave. But Frost himself said the poem was a gentle mockery of a friend who always regretted not taking the other path, whichever one he took. The roads were the same. The difference was only in the telling.</p>
<p>I think about this when I make decisions I''m not sure about. The uncertainty is not a sign I''m choosing wrong. It''s a sign I''m choosing at all — that the options are real and the stakes are genuine. A decision without uncertainty is not a decision; it''s just the inevitable next step.</p>
<p>What you discover, if you pay attention, is that the paths converge more than you''d expect. The choices that feel momentous from the outside tend to lead, in the lived experience, to very similar landscapes. What changes is not where you end up so much as how you moved — what you noticed, what you learned to do without, what turned out to matter.</p>',
  'Philosophy', 'Essay', 'linear-gradient(135deg,#1e1810,#3a2518)', 'rgba(200,98,10,.3)', '5 min',
  241, 'published', now() - interval '10 days');

-- Two drafts so the Write page opens with work in progress.
insert into public.articles (id, author_id, title, subtitle, body, tag, form, read_time, word_count, status) values
  ('00000000-0000-4000-b000-000000000090', '00000000-0000-4000-a000-000000000001', 'Notes on Beginning Again',
   'A draft about restarting a practice you thought you had lost',
   '<p>Every return is a small act of faith. You sit down at the same desk, with the same hands, and pretend the gap never happened.</p>',
   'Writing', 'Essay', '2 min', 31, 'draft'),
  ('00000000-0000-4000-b000-000000000091', '00000000-0000-4000-a000-000000000001', 'The Weight of Unsent Letters', 'Untitled draft',
   '<p>There is a folder on my desktop called <em>later</em>. It has been there for four years.</p>',
   'Essays', 'Essay', '1 min', 24, 'draft');

-- ─────────────────────────── follows ────────────────────────────
insert into public.follows (follower_id, following_id) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000004'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000007'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000005'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000004'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000005'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000007'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000007'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000004'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000005'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000007'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000004'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000006')
on conflict do nothing;

-- ──────────────────── likes, bookmarks, comments ────────────────
insert into public.likes (user_id, article_id) values
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000001'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000001'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000001'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000002'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000002'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000002'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000003'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000003'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000003'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000004'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000004'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000004'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000004'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000005'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000005'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000005'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000006'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000006'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000006'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000006')
on conflict do nothing;

insert into public.bookmarks (user_id, article_id, folder) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Craft'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002', 'Read later'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000003', 'Read later'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000005', 'Favourites'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000006', 'Read later'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000006', 'Favourites')
on conflict do nothing;

insert into public.comments (article_id, user_id, body, created_at) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000002', 'This landed exactly where I needed it to. The line about the pause being full — I am going to be thinking about that all week.', now() - interval '3 hours'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000004', 'Reading this on a train, which felt right somehow.', now() - interval '10 hours'),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 'Silence is one of the most informative things there is. Stealing this for my notebook, with attribution.', now() - interval '17 hours'),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000006', 'The Cage reference earns its place here. Nicely done.', now() - interval '24 hours'),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000001', 'I have been arguing this for years and never this clearly. Thank you.', now() - interval '31 hours'),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000005', 'The section on place as a memory scaffold is doing a lot of quiet work.', now() - interval '38 hours'),
  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000003', 'Beautiful. The ending turns without announcing itself.', now() - interval '45 hours'),
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000002', 'Welcome back to publishing — this was worth the wait.', now() - interval '52 hours'),
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000004', 'That closing paragraph. Oof.', now() - interval '59 hours');

-- ─────────────────────────── collections ────────────────────────
insert into public.collections (id, user_id, name, description, color, is_public) values
  ('00000000-0000-4000-b000-000000000101', '00000000-0000-4000-a000-000000000001', 'On Attention', 'Pieces that taught me how to notice things.', 'amber', true),
  ('00000000-0000-4000-b000-000000000102', '00000000-0000-4000-a000-000000000001', 'Craft & Process', 'How other writers actually get the words down.', 'sage', true),
  ('00000000-0000-4000-b000-000000000103', '00000000-0000-4000-a000-000000000001', 'Read Twice', 'Rewards a second pass.', 'lavender', false),
  ('00000000-0000-4000-b000-000000000104', '00000000-0000-4000-a000-000000000002', 'Slow Living', 'Arguments for going more slowly.', 'sky', true);

insert into public.collection_items (collection_id, article_id) values
  ('00000000-0000-4000-b000-000000000101', '00000000-0000-4000-b000-000000000002'),
  ('00000000-0000-4000-b000-000000000101', '00000000-0000-4000-b000-000000000004'),
  ('00000000-0000-4000-b000-000000000101', '00000000-0000-4000-b000-000000000005'),
  ('00000000-0000-4000-b000-000000000102', '00000000-0000-4000-b000-000000000001'),
  ('00000000-0000-4000-b000-000000000102', '00000000-0000-4000-b000-000000000006'),
  ('00000000-0000-4000-b000-000000000103', '00000000-0000-4000-b000-000000000003'),
  ('00000000-0000-4000-b000-000000000103', '00000000-0000-4000-b000-000000000005'),
  ('00000000-0000-4000-b000-000000000104', '00000000-0000-4000-b000-000000000003'),
  ('00000000-0000-4000-b000-000000000104', '00000000-0000-4000-b000-000000000002')
on conflict do nothing;

-- ─────────────────────────── notes ──────────────────────────────
insert into public.notes (user_id, title, body, color, created_at) values
  ('00000000-0000-4000-a000-000000000001', 'Opening lines worth stealing', 'Not stealing. Studying.

- "The first draft of anything is just you talking to yourself."
- Start in motion. Never start with weather.', 'pastel-yellow', now() - interval '2 days'),
  ('00000000-0000-4000-a000-000000000001', 'Essay idea — the folder called later', 'Everyone has one. What is actually in it? Start with mine, widen out. Maybe interview three people about their unsent things.', 'pastel-blue', now() - interval '5 days'),
  ('00000000-0000-4000-a000-000000000001', 'On revision', 'Cut the first paragraph. It is almost always throat-clearing. The real beginning is usually the second or third.', 'pastel-green', now() - interval '9 days'),
  ('00000000-0000-4000-a000-000000000001', 'Reading queue', 'Berger — Ways of Seeing
Solnit — A Field Guide to Getting Lost
Dillard — The Writing Life (reread)', 'pastel-pink', now() - interval '14 days'),
  ('00000000-0000-4000-a000-000000000002', 'Silence draft notes', 'Two kinds: absence vs presence. Lead with the elevator phone reflex — everyone recognises it.', 'pastel-yellow', now() - interval '3 days');

-- ─────────────────────────── annotations ────────────────────────
insert into public.annotations (user_id, article_id, quote, note, color, created_at) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'The pause before you begin isn''t empty — it''s full.', 'This reframes the block entirely. Not a failure state — a full one.', 'pastel-yellow', now() - interval '1 days'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002', 'the difference between thinking and noticing', 'The whole essay is really about this one distinction.', 'pastel-green', now() - interval '2 days'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000005', 'every possible first sentence', 'Compare to Wu on commitment. Same idea, different door.', 'pastel-blue', now() - interval '4 days');

-- ─────────────────────── messages / conversations ───────────────
insert into public.conversations (id) values ('00000000-0000-4000-b000-000000000201');
insert into public.conversation_participants (conversation_id, user_id) values ('00000000-0000-4000-b000-000000000201', '00000000-0000-4000-a000-000000000001'), ('00000000-0000-4000-b000-000000000201', '00000000-0000-4000-a000-000000000002');
insert into public.messages (conversation_id, sender_id, body, created_at) values
  ('00000000-0000-4000-b000-000000000201', '00000000-0000-4000-a000-000000000002', 'Sarah — I finally read "The Path Less Traveled". The third section is the best thing you have published.', now() - interval '4 hours'),
  ('00000000-0000-4000-b000-000000000201', '00000000-0000-4000-a000-000000000001', 'That means a lot coming from you. That section took four rewrites.', now() - interval '3 hours'),
  ('00000000-0000-4000-b000-000000000201', '00000000-0000-4000-a000-000000000002', 'It does not show, which is the point. Are you free Thursday? Thinking of starting a reading room around it.', now() - interval '3 hours'),
  ('00000000-0000-4000-b000-000000000201', '00000000-0000-4000-a000-000000000001', 'Thursday works. Evening is better for me.', now() - interval '2 hours'),
  ('00000000-0000-4000-b000-000000000201', '00000000-0000-4000-a000-000000000002', 'Evening it is. I will set it up.', now() - interval '1 hour');
insert into public.conversations (id) values ('00000000-0000-4000-b000-000000000202');
insert into public.conversation_participants (conversation_id, user_id) values ('00000000-0000-4000-b000-000000000202', '00000000-0000-4000-a000-000000000001'), ('00000000-0000-4000-b000-000000000202', '00000000-0000-4000-a000-000000000004');
insert into public.messages (conversation_id, sender_id, body, created_at) values
  ('00000000-0000-4000-b000-000000000202', '00000000-0000-4000-a000-000000000004', 'Do you ever get the feeling a piece is finished but you keep opening it anyway?', now() - interval '2 days'),
  ('00000000-0000-4000-b000-000000000202', '00000000-0000-4000-a000-000000000001', 'Constantly. I have one that has been "finished" since March.', now() - interval '2 days'),
  ('00000000-0000-4000-b000-000000000202', '00000000-0000-4000-a000-000000000004', 'Ha. Solidarity. Send it to me when you stop opening it.', now() - interval '2 days'),
  ('00000000-0000-4000-b000-000000000202', '00000000-0000-4000-a000-000000000004', 'Also — your notes on revision changed how I edit. The cut-the-first-paragraph rule is brutal and correct.', now() - interval '1 day');
insert into public.conversations (id) values ('00000000-0000-4000-b000-000000000203');
insert into public.conversation_participants (conversation_id, user_id) values ('00000000-0000-4000-b000-000000000203', '00000000-0000-4000-a000-000000000001'), ('00000000-0000-4000-b000-000000000203', '00000000-0000-4000-a000-000000000005');
insert into public.messages (conversation_id, sender_id, body, created_at) values
  ('00000000-0000-4000-b000-000000000203', '00000000-0000-4000-a000-000000000005', 'Quick question about the Writing DNA feature — how is the craft score actually calculated?', now() - interval '5 hours'),
  ('00000000-0000-4000-b000-000000000203', '00000000-0000-4000-a000-000000000001', 'Honestly? Mostly vibes and sentence-length variance. But the variance part is real.', now() - interval '4 hours'),
  ('00000000-0000-4000-b000-000000000203', '00000000-0000-4000-a000-000000000005', 'That is the most writer answer possible.', now() - interval '4 hours');
insert into public.conversations (id) values ('00000000-0000-4000-b000-000000000204');
insert into public.conversation_participants (conversation_id, user_id) values ('00000000-0000-4000-b000-000000000204', '00000000-0000-4000-a000-000000000001'), ('00000000-0000-4000-b000-000000000204', '00000000-0000-4000-a000-000000000003');
insert into public.messages (conversation_id, sender_id, body, created_at) values
  ('00000000-0000-4000-b000-000000000204', '00000000-0000-4000-a000-000000000003', 'Loved your annotation on the memory piece. Would you mind if I quoted it in a footnote?', now() - interval '3 days'),
  ('00000000-0000-4000-b000-000000000204', '00000000-0000-4000-a000-000000000001', 'Please do. Flattered.', now() - interval '3 days');

-- ─────────────────────── reading rooms ──────────────────────────
insert into public.rooms (id, host_id, article_id, title, description, is_live, started_at) values
  ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Reading "On Silence" together', 'Slow read, one section at a time. Cameras off, thoughts on.', true, now() - interval '25 minutes'),
  ('00000000-0000-4000-b000-000000000302', '00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000005', 'The Distance Between Stars — close read', 'Line by line through the middle section.', true, now() - interval '8 minutes'),
  ('00000000-0000-4000-b000-000000000303', '00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000003', 'Against Productivity — argument clinic', 'Come disagree with me.', true, now() - interval '52 minutes'),
  ('00000000-0000-4000-b000-000000000304', '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000004', 'Memory & place: an open room', 'Bring a passage that stuck with you.', false, now() - interval '3 days');

insert into public.room_participants (room_id, user_id) values
  ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000002'), ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000001'), ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000005'), ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000007'),
  ('00000000-0000-4000-b000-000000000302', '00000000-0000-4000-a000-000000000004'), ('00000000-0000-4000-b000-000000000302', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-b000-000000000303', '00000000-0000-4000-a000-000000000006'), ('00000000-0000-4000-b000-000000000303', '00000000-0000-4000-a000-000000000002'), ('00000000-0000-4000-b000-000000000303', '00000000-0000-4000-a000-000000000005')
on conflict do nothing;

insert into public.room_messages (room_id, user_id, body, created_at) values
  ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000002', 'Starting at the second section — the elevator paragraph.', now() - interval '20 minutes'),
  ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000005', 'That reflex is so exactly right it is uncomfortable.', now() - interval '18 minutes'),
  ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000001', 'The turn from absence to presence is where it stops being a mood piece.', now() - interval '15 minutes'),
  ('00000000-0000-4000-b000-000000000301', '00000000-0000-4000-a000-000000000007', 'Agreed. Before that I was not sure it had an argument.', now() - interval '12 minutes'),
  ('00000000-0000-4000-b000-000000000303', '00000000-0000-4000-a000-000000000006', 'Opening provocation: rest is not a productivity input.', now() - interval '40 minutes'),
  ('00000000-0000-4000-b000-000000000303', '00000000-0000-4000-a000-000000000002', 'I want to agree but the essay smuggles in a productivity frame anyway.', now() - interval '35 minutes');

-- ─────────────────────── notifications ──────────────────────────
insert into public.notifications (user_id, actor_id, type, title, body, action, read, created_at) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', 'follow', 'Marcus Reid started following you', '', 'notifFollowBack', false, now() - interval '2 minutes'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000004', 'like', 'Aisha Patel liked your piece "The Silence Between Words"', '', null, false, now() - interval '39 minutes'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000005', 'comment', 'James Wu annotated your piece: "This passage stopped me cold — so precise."', '', 'notifViewAnnotation', false, now() - interval '76 minutes'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000003', 'room', 'Lena Torres started a Reading Room for your essay "On Walking and Thinking"', '', 'notifJoinRoom', false, now() - interval '113 minutes'),
  ('00000000-0000-4000-a000-000000000001', null, 'milestone', 'Your piece "Against Productivity Culture" reached 200 likes — top 3% this week!', '', 'notifViewPost', false, now() - interval '150 minutes'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000006', 'follow', 'David Kim started following you', '', 'notifFollowBack', true, now() - interval '15500 minutes'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000001', 'like', 'Sophie Clark liked "The Architecture of Memory" and 3 others', '', null, true, now() - interval '16400 minutes'),
  ('00000000-0000-4000-a000-000000000001', null, 'comment', 'Riya Nair replied to your annotation on "On Silence and the Art of Listening"', '', 'notifViewAnnotation', true, now() - interval '17300 minutes'),
  ('00000000-0000-4000-a000-000000000001', null, 'system', 'Your weekly digest is ready — 3,240 words written, 74% completion rate. Great week!', '', 'notifViewInsights', true, now() - interval '18200 minutes'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', 'room', 'Marcus Reid invited you to a Reading Room: "Writing in the Dark"', '', 'notifJoinRoom', true, now() - interval '19100 minutes'),
  ('00000000-0000-4000-a000-000000000001', null, 'milestone', 'You''ve kept a 10-day writing streak! Keep going — you''re building something real.', '', null, true, now() - interval '20000 minutes'),
  ('00000000-0000-4000-a000-000000000001', null, 'system', 'Your Time Capsule "Letter to Myself at 40" will unlock in 18 days', '', 'notifViewCapsule', true, now() - interval '20900 minutes');

update public.profiles set prefs = '{"notifications":{"follow":true,"like":true,"comment":true,"room":true,"milestone":true,"system":false},"theme":"dark","accent":"amber","font":"playfair","fontSize":18,"lineHeight":170}'::jsonb where id = '00000000-0000-4000-a000-000000000001';

-- ─────────────────────── time capsules ──────────────────────────
insert into public.time_capsules (user_id, title, body, deliver_at, delivered, created_at) values
  ('00000000-0000-4000-a000-000000000001', 'To myself, one year from now',
   'You were worried about whether any of this was worth doing. I hope by now the question has gotten boring. Did you finish the long one? Did you let anyone read it?',
   now() + interval '8 months', false, now() - interval '4 months'),
  ('00000000-0000-4000-a000-000000000001', 'Before the book',
   'Right now there is no book. There is a folder and a bad title. Whatever happened, you started here.',
   now() + interval '2 years', false, now() - interval '1 month'),
  ('00000000-0000-4000-a000-000000000001', 'A note from last winter',
   'It is January and I have written nothing for six weeks. I am writing this so that future-me knows the gap closed.',
   now() - interval '10 days', true, now() - interval '9 months');

-- ─────────────────── writing sessions (Craft Insights) ──────────
insert into public.writing_sessions (user_id, day, words, minutes) values
  ('00000000-0000-4000-a000-000000000001', current_date - 0, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 1, 993, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 2, 390, 22),
  ('00000000-0000-4000-a000-000000000001', current_date - 3, 939, 42),
  ('00000000-0000-4000-a000-000000000001', current_date - 4, 585, 29),
  ('00000000-0000-4000-a000-000000000001', current_date - 5, 835, 38),
  ('00000000-0000-4000-a000-000000000001', current_date - 6, 754, 35),
  ('00000000-0000-4000-a000-000000000001', current_date - 7, 987, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 8, 885, 40),
  ('00000000-0000-4000-a000-000000000001', current_date - 9, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 10, 968, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 11, 302, 19),
  ('00000000-0000-4000-a000-000000000001', current_date - 12, 1000, 44),
  ('00000000-0000-4000-a000-000000000001', current_date - 13, 269, 18),
  ('00000000-0000-4000-a000-000000000001', current_date - 14, 1277, 54),
  ('00000000-0000-4000-a000-000000000001', current_date - 15, 474, 25),
  ('00000000-0000-4000-a000-000000000001', current_date - 16, 901, 40),
  ('00000000-0000-4000-a000-000000000001', current_date - 17, 660, 32),
  ('00000000-0000-4000-a000-000000000001', current_date - 18, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 19, 814, 37),
  ('00000000-0000-4000-a000-000000000001', current_date - 20, 614, 30),
  ('00000000-0000-4000-a000-000000000001', current_date - 21, 1226, 52),
  ('00000000-0000-4000-a000-000000000001', current_date - 22, 422, 23),
  ('00000000-0000-4000-a000-000000000001', current_date - 23, 988, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 24, 213, 16),
  ('00000000-0000-4000-a000-000000000001', current_date - 25, 997, 44),
  ('00000000-0000-4000-a000-000000000001', current_date - 26, 357, 21),
  ('00000000-0000-4000-a000-000000000001', current_date - 27, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 28, 856, 39),
  ('00000000-0000-4000-a000-000000000001', current_date - 29, 854, 39),
  ('00000000-0000-4000-a000-000000000001', current_date - 30, 730, 34),
  ('00000000-0000-4000-a000-000000000001', current_date - 31, 713, 33),
  ('00000000-0000-4000-a000-000000000001', current_date - 32, 867, 39),
  ('00000000-0000-4000-a000-000000000001', current_date - 33, 536, 27),
  ('00000000-0000-4000-a000-000000000001', current_date - 34, 959, 42),
  ('00000000-0000-4000-a000-000000000001', current_date - 35, 635, 31),
  ('00000000-0000-4000-a000-000000000001', current_date - 36, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 37, 236, 16),
  ('00000000-0000-4000-a000-000000000001', current_date - 38, 984, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 39, 443, 24),
  ('00000000-0000-4000-a000-000000000001', current_date - 40, 916, 41),
  ('00000000-0000-4000-a000-000000000001', current_date - 41, 633, 31),
  ('00000000-0000-4000-a000-000000000001', current_date - 42, 1100, 47),
  ('00000000-0000-4000-a000-000000000001', current_date - 43, 792, 36),
  ('00000000-0000-4000-a000-000000000001', current_date - 44, 642, 31),
  ('00000000-0000-4000-a000-000000000001', current_date - 45, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 46, 453, 24),
  ('00000000-0000-4000-a000-000000000001', current_date - 47, 982, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 48, 247, 17),
  ('00000000-0000-4000-a000-000000000001', current_date - 49, 1299, 54),
  ('00000000-0000-4000-a000-000000000001', current_date - 50, 324, 20),
  ('00000000-0000-4000-a000-000000000001', current_date - 51, 962, 42),
  ('00000000-0000-4000-a000-000000000001', current_date - 52, 526, 27),
  ('00000000-0000-4000-a000-000000000001', current_date - 53, 873, 39),
  ('00000000-0000-4000-a000-000000000001', current_date - 54, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 55, 738, 34),
  ('00000000-0000-4000-a000-000000000001', current_date - 56, 1148, 49),
  ('00000000-0000-4000-a000-000000000001', current_date - 57, 565, 28),
  ('00000000-0000-4000-a000-000000000001', current_date - 58, 947, 42),
  ('00000000-0000-4000-a000-000000000001', current_date - 59, 368, 21),
  ('00000000-0000-4000-a000-000000000001', current_date - 60, 996, 44),
  ('00000000-0000-4000-a000-000000000001', current_date - 61, 202, 15),
  ('00000000-0000-4000-a000-000000000001', current_date - 62, 990, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 63, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 64, 930, 41),
  ('00000000-0000-4000-a000-000000000001', current_date - 65, 605, 30),
  ('00000000-0000-4000-a000-000000000001', current_date - 66, 821, 37),
  ('00000000-0000-4000-a000-000000000001', current_date - 67, 770, 36),
  ('00000000-0000-4000-a000-000000000001', current_date - 68, 669, 32),
  ('00000000-0000-4000-a000-000000000001', current_date - 69, 896, 40),
  ('00000000-0000-4000-a000-000000000001', current_date - 70, 785, 36),
  ('00000000-0000-4000-a000-000000000001', current_date - 71, 974, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 72, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 73, 1000, 44),
  ('00000000-0000-4000-a000-000000000001', current_date - 74, 291, 18),
  ('00000000-0000-4000-a000-000000000001', current_date - 75, 971, 43),
  ('00000000-0000-4000-a000-000000000001', current_date - 76, 495, 26),
  ('00000000-0000-4000-a000-000000000001', current_date - 77, 1190, 51),
  ('00000000-0000-4000-a000-000000000001', current_date - 78, 678, 32),
  ('00000000-0000-4000-a000-000000000001', current_date - 79, 762, 35),
  ('00000000-0000-4000-a000-000000000001', current_date - 80, 828, 38),
  ('00000000-0000-4000-a000-000000000001', current_date - 81, 0, 0),
  ('00000000-0000-4000-a000-000000000001', current_date - 82, 935, 41),
  ('00000000-0000-4000-a000-000000000001', current_date - 83, 400, 22),
  ('00000000-0000-4000-a000-000000000001', current_date - 84, 1292, 54),
  ('00000000-0000-4000-a000-000000000001', current_date - 85, 191, 15),
  ('00000000-0000-4000-a000-000000000001', current_date - 86, 994, 44),
  ('00000000-0000-4000-a000-000000000001', current_date - 87, 379, 22),
  ('00000000-0000-4000-a000-000000000001', current_date - 88, 943, 42),
  ('00000000-0000-4000-a000-000000000001', current_date - 89, 576, 29)
on conflict (user_id, day) do update set words = excluded.words, minutes = excluded.minutes;

-- ─────────────────────── writing DNA ────────────────────────────
insert into public.writing_dna (user_id, craft_score, traits, signature_words, influences, rhythm) values
  ('00000000-0000-4000-a000-000000000001', 91, '[{"name":"Lyrical","value":88,"color":"var(--lavender)"},{"name":"Introspective","value":76,"color":"var(--sky)"},{"name":"Philosophical","value":64,"color":"var(--amber)"},{"name":"Conversational","value":42,"color":"var(--sage)"},{"name":"Narrative","value":35,"color":"var(--rose)"}]'::jsonb, '[{"w":"silence","size":16,"c":"amber"},{"w":"attention","size":13,"c":"lavender"},{"w":"memory","size":18,"c":"sage"},{"w":"landscape","size":12,"c":"sky"},{"w":"noticing","size":14,"c":"amber"},{"w":"threshold","size":11,"c":"rose"},{"w":"presence","size":15,"c":"lavender"},{"w":"cartography","size":12,"c":"sage"},{"w":"intimacy","size":13,"c":"amber"}]'::jsonb,
   '[{"name":"Annie Dillard","match":82},{"name":"John Berger","match":74},{"name":"Rebecca Solnit","match":71},{"name":"Maggie Nelson","match":63}]'::jsonb, '{"avgSentence":18.4,"avgParagraph":4.2,"varianceScore":76,"readingLevel":"Grade 11"}'::jsonb)
on conflict (user_id) do update set
  craft_score=excluded.craft_score, traits=excluded.traits,
  signature_words=excluded.signature_words, influences=excluded.influences, rhythm=excluded.rhythm;

-- ════════════════════════════════════════════════════════════════
--  Done. Sign in with  sarah@think.app  /  think1234
-- ════════════════════════════════════════════════════════════════
