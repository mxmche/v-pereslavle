import { PrismaClient, SourceType } from '@prisma/client';

const prisma = new PrismaClient();

const sources: { name: string; url: string; type: SourceType; adapter: string; enabled: boolean }[] = [
  { name: 'Туристический Переславль', url: 'https://tourismpereslavl.ru', type: 'HTML', adapter: 'html-tourismpereslavl', enabled: true },
  { name: 'Администрация района', url: 'https://admpereslavl.ru', type: 'RSS', adapter: 'rss-admpereslavl', enabled: true },
  { name: 'Культура Ярославской области', url: 'https://culture76.ru', type: 'HTML', adapter: 'html-culture76', enabled: false },
  { name: 'Переславский музей-заповедник', url: 'https://museumpereslavl.ru', type: 'HTML', adapter: 'html-museumpereslavl', enabled: true },
  { name: 'Кинотеатр «Оскар»', url: 'https://kino-oskar.ru', type: 'HTML', adapter: 'html-kino-oskar', enabled: false },
  { name: 'Отель «Оскар»', url: 'https://hoteloskar.ru/events', type: 'HTML', adapter: 'html-hoteloskar', enabled: false },
  { name: 'Феодоровский монастырь', url: 'https://feodor-monastyr.ru', type: 'HTML', adapter: 'html-feodor', enabled: false },
  { name: 'Паломническая служба', url: 'https://feosobor.ru', type: 'HTML', adapter: 'html-feosobor', enabled: false },
  { name: 'Pereslove', url: 'https://pereslove.ru', type: 'HTML', adapter: 'html-pereslove', enabled: false },
  { name: 'ТутЛю', url: 'https://tutly.ru', type: 'HTML', adapter: 'html-tutly', enabled: false },
  { name: 'Qtickets', url: 'https://qtickets.ru', type: 'HTML', adapter: 'html-qtickets', enabled: false },
  { name: 'Яр-ШОУ', url: 'https://yar-show.ru', type: 'HTML', adapter: 'html-yarshow', enabled: false },
  { name: 'Артефакт', url: 'https://ar.culture.ru', type: 'HTML', adapter: 'html-artefact', enabled: false },
  { name: 'RussiaDiscovery', url: 'https://russiadiscovery.ru', type: 'HTML', adapter: 'html-russiadiscovery', enabled: false },
  { name: 'ВК «Анонсы мероприятий в ПЗ»', url: 'https://vk.ru/anons_pz', type: 'VK', adapter: 'vk-wall', enabled: true },
  { name: 'ВК кинотеатра «Оскар»', url: 'https://vk.ru/oskar.amigopz', type: 'VK', adapter: 'vk-wall', enabled: false },
  { name: 'TG «Полёты в Переславле»', url: 'https://t.me/fly_pereslavl', type: 'TELEGRAM', adapter: 'tg-channel', enabled: false },
  { name: 'Instagram ТИЦ', url: 'https://www.instagram.com/tourismpereslavl/', type: 'MANUAL', adapter: 'manual', enabled: false },
];

// Coordinates are approximate — verify on a map before showing on the public site.
const locations: { slug: string; name: string; aliases: string[]; address?: string; lat?: number; lng?: number }[] = [
  { slug: 'krasnaya-ploshchad', name: 'Красная площадь', aliases: ['Красная пл.', 'Красная площадь Переславля', 'Кремль'], address: 'пл. Красная, 1а', lat: 56.7396, lng: 38.8515 },
  { slug: 'dk-pereslavl', name: 'Дом культуры', aliases: ['ДК', 'ДК города Переславля-Залесского', 'городской ДК', 'ГДК'], address: 'Народная пл., 8', lat: 56.7367, lng: 38.8527 },
  { slug: 'kino-oskar', name: 'Кинотеатр «Оскар»', aliases: ['Оскар', 'кинотеатр Оскар', 'Оскар Переславль'], address: 'ул. Маяковского, 6', lat: 56.7345, lng: 38.8575 },
  { slug: 'biblioteka-malashenko', name: 'Центральная городская библиотека им. Малашенко', aliases: ['ЦГБ', 'библиотека Малашенко', 'городская библиотека', 'центральная библиотека'], address: 'ул. 50 лет Комсомола, 1', lat: 56.7352, lng: 38.8548 },
  { slug: 'goritsky-monastyr', name: 'Музей-заповедник в Горицком монастыре', aliases: ['Горицкий монастырь', 'Горицы', 'музей-заповедник', 'Переславский музей-заповедник', 'Горицкий Успенский монастырь'], address: 'Музейный пер., 4', lat: 56.7431, lng: 38.8635 },
  { slug: 'botik-petra', name: 'Музей «Ботик Петра I»', aliases: ['Ботик', 'Ботик Петра', 'Ботик Петра I', 'усадьба Ботик', 'Веськово'], lat: 56.7104, lng: 38.8493 },
  { slug: 'muzey-radio', name: 'Музей радио', aliases: ['музей радио А. С. Попова', 'Музей радио Переславль'], address: 'ул. Советская, 14', lat: 56.7380, lng: 38.8550 },
  { slug: 'nikitsky-monastyr', name: 'Никитский монастырь', aliases: ['Никитский', 'Никитский мужской монастырь', 'Никитская слобода'], lat: 56.7745, lng: 38.8690 },
  { slug: 'feodorovsky-monastyr', name: 'Феодоровский монастырь', aliases: ['Феодоровский', 'Феодоровский женский монастырь', 'Феодоровская обитель'], lat: 56.7395, lng: 38.8337 },
  { slug: 'spaso-preobrazhensky-sobor', name: 'Спасо-Преображенский собор', aliases: ['Спасо-Преображенский', 'Преображенский собор', 'Спасо-Преображенский собор на Красной площади'], address: 'пл. Красная', lat: 56.7399, lng: 38.8510 },
  { slug: 'pleshcheevo-ozero', name: 'Плещеево озеро', aliases: ['Плещеево', 'озеро Плещеево', 'Плещеево озеро набережная', 'пляж на Плещеевом озере'], lat: 56.7570, lng: 38.8260 },
  { slug: 'muzey-utyuga', name: 'Музей утюга', aliases: ['Утюг', 'музей утюгов'], lat: 56.7385, lng: 38.8530 },
];

async function main() {
  for (const l of locations) {
    await prisma.location.upsert({ where: { slug: l.slug }, update: {}, create: l });
  }
  console.log(`Seeded ${locations.length} locations`);

  for (const s of sources) {
    const existing = await prisma.source.findFirst({ where: { url: s.url } });
    if (!existing) await prisma.source.create({ data: s });
  }
  console.log(`Seeded ${sources.length} sources`);
}

main().finally(() => prisma.$disconnect());
