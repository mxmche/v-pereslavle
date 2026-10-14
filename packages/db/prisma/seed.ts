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

async function main() {
  for (const s of sources) {
    const existing = await prisma.source.findFirst({ where: { url: s.url } });
    if (!existing) await prisma.source.create({ data: s });
  }
  console.log(`Seeded ${sources.length} sources`);
}

main().finally(() => prisma.$disconnect());
