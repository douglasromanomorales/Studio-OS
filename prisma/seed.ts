import { PrismaClient, PricingMode } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Cada serviço declara seus próprios atributos explicitamente — nenhum deles é
 * derivado de `name` (Catalog Over Logic, cap. 29 / Explicit Domain Rules, cap. 31).
 * A versão anterior deste arquivo tinha `requiresStrandTest: name === "Mechas..."`
 * e `requiresCredential: name.includes("Botox") ? ... : null` — ambos corrigidos
 * aqui como o achado de auditoria da modelagem do domínio Serviços exigia.
 */
interface QuoteServiceSeed {
  category: string;
  name: string;
  durationMinutes: number;
  requiresStrandTest: boolean;
  requiresCredential: string | null;
  recommendedSpecialties: string[];
}

const QUOTE_SERVICES: QuoteServiceSeed[] = [
  {
    category: "Cabelos",
    name: "Mechas (tradicionais, iluminadas e personalizadas)",
    durationMinutes: 180,
    requiresStrandTest: true,
    requiresCredential: null,
    recommendedSpecialties: ["Coloração"],
  },
  {
    category: "Cabelos",
    name: "Correção de cor",
    durationMinutes: 240,
    requiresStrandTest: true,
    requiresCredential: null,
    recommendedSpecialties: ["Coloração"],
  },
  {
    category: "Cabelos",
    name: "Coloração global",
    durationMinutes: 150,
    requiresStrandTest: true,
    requiresCredential: null,
    recommendedSpecialties: ["Coloração"],
  },
  {
    category: "Cabelos",
    name: "Tonalização",
    durationMinutes: 90,
    requiresStrandTest: false,
    requiresCredential: null,
    recommendedSpecialties: [],
  },
  {
    category: "Cabelos",
    name: "Teste de Mechas",
    durationMinutes: 30,
    requiresStrandTest: false,
    requiresCredential: null,
    recommendedSpecialties: [],
  },
  {
    category: "Alisamentos & Alinhamento",
    name: "Alisamento seguro para loiras",
    durationMinutes: 180,
    requiresStrandTest: true,
    requiresCredential: null,
    recommendedSpecialties: ["Alisamento"],
  },
  {
    category: "Alisamentos & Alinhamento",
    name: "Técnica de alinhamento (sem efeito liso)",
    durationMinutes: 150,
    requiresStrandTest: false,
    requiresCredential: null,
    recommendedSpecialties: ["Alisamento"],
  },
  {
    category: "Estética Facial",
    name: "Aplicação de toxina botulínica (Botox)",
    durationMinutes: 45,
    requiresStrandTest: false,
    requiresCredential: "Toxina Botulínica", // declarado direto, nunca via name.includes()
    recommendedSpecialties: [],
  },
  {
    category: "Estética Corporal & Bem-Estar",
    name: "Drenagem linfática",
    durationMinutes: 60,
    requiresStrandTest: false,
    requiresCredential: null,
    recommendedSpecialties: [],
  },
  {
    category: "Estética Corporal & Bem-Estar",
    name: "Hidrolipo",
    durationMinutes: 60,
    requiresStrandTest: false,
    requiresCredential: null,
    recommendedSpecialties: [],
  },
];

interface FixedServiceSeed {
  category: string;
  name: string;
  durationMinutes: number;
  price: number;
}

const FIXED_SERVICES: FixedServiceSeed[] = [
  { category: "Bronze & Pele Iluminada", name: "Bronze Natural – Aplicação", durationMinutes: 60, price: 129.9 },
  { category: "Bronze & Pele Iluminada", name: "Preparo de Pele + Bronze Natural", durationMinutes: 90, price: 149.9 },
  { category: "Bronze & Pele Iluminada", name: "Banho de Lua Iluminador", durationMinutes: 45, price: 99.9 },
  { category: "Unhas", name: "Manicure", durationMinutes: 45, price: 45.0 },
  { category: "Unhas", name: "Pedicure", durationMinutes: 50, price: 55.0 },
  { category: "Depilação", name: "Sobrancelhas", durationMinutes: 20, price: 35.0 },
];

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "Casa Nataly Rodrigues",
      slug: "casa-nataly-rodrigues",
      timezone: "America/Sao_Paulo",
      plan: "PRO",
    },
  });

  const categories = await Promise.all(
    [
      "Cabelos",
      "Alisamentos & Alinhamento",
      "Olhar — Sobrancelhas & Cílios",
      "Lábios",
      "Estética Facial",
      "Estética Corporal & Bem-Estar",
      "Bronze & Pele Iluminada",
      "Unhas",
      "Depilação",
    ].map((name, order) => prisma.serviceCategory.create({ data: { organizationId: org.id, name, order } }))
  );
  const categoryId = (name: string) => categories.find((c) => c.name === name)!.id;

  for (const svc of QUOTE_SERVICES) {
    await prisma.service.create({
      data: {
        organizationId: org.id,
        categoryId: categoryId(svc.category),
        name: svc.name,
        durationMinutes: svc.durationMinutes,
        pricingMode: PricingMode.QUOTE_REQUIRED,
        requiresStrandTest: svc.requiresStrandTest,
        requiresCredential: svc.requiresCredential,
        recommendedSpecialties: svc.recommendedSpecialties,
      },
    });
  }

  const fixedIds: Record<string, string> = {};
  for (const svc of FIXED_SERVICES) {
    const created = await prisma.service.create({
      data: {
        organizationId: org.id,
        categoryId: categoryId(svc.category),
        name: svc.name,
        durationMinutes: svc.durationMinutes,
        price: svc.price,
        pricingMode: PricingMode.FIXED,
      },
    });
    fixedIds[svc.name] = created.id;
  }

  await prisma.serviceBundle.create({
    data: {
      organizationId: org.id,
      name: "Pacote Pele Iluminada",
      price: 229.9,
      description: "Banho de Lua Iluminador + Detox Corporal (esfoliação + queratina corporal) + Bronze Natural",
      items: {
        create: [
          { serviceId: fixedIds["Banho de Lua Iluminador"] },
          { serviceId: fixedIds["Bronze Natural – Aplicação"] },
        ],
      },
    },
  });

  console.log("Seed concluído para:", org.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
