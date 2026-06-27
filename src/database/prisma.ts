import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

import { env } from "@/config/env.config";

/**
 * Garante que a variável global não seja redeclarada entre hot-reloads
 * em desenvolvimento, evitando múltiplas conexões abertas com o banco.
 */
declare global {
    var prismaGlobal: PrismaClient | undefined;
}

/**
 * Instancia o PrismaClient com o driver nativo do PostgreSQL.
 *
 * Usa `PrismaPg` como adapter para rodar sem necessidade do Prisma Accelerate,
 * permitindo conexão direta via `DATABASE_URL`.
 */
function createPrismaClient() {
    const adapter = new PrismaPg({
        connectionString: env.DATABASE_URL,
    });

    return new PrismaClient({
        adapter,
        log: ["warn", "error"],
    });
}

/**
 * Retorna a instância singleton do PrismaClient.
 *
 * Em produção, cria uma nova instância a cada inicialização do servidor.
 * Em desenvolvimento, reutiliza a instância armazenada em `globalThis` para
 * evitar o esgotamento do pool de conexões causado pelo hot-reload do Next.js.
 *
 * @throws {Error} Se chamado fora do runtime Node.js (Edge Runtime ou browser).
 *
 * @example
 * import { getPrisma } from "@/lib/prisma";
 *
 * const prisma = getPrisma();
 * const users = await prisma.user.findMany();
 */
export function getPrisma() {
    // O Prisma não é compatível com Edge Runtime nem com o browser —
    // ambos não expõem `process.versions.node`.
    if (typeof process === "undefined" || !process?.versions?.node) {
        throw new Error("Prisma só pode ser usado no runtime Node.js");
    }

    const prisma = globalThis.prismaGlobal ?? createPrismaClient();

    // Persiste a instância globalmente apenas fora de produção,
    // onde o hot-reload do Next.js recriaria o módulo a cada alteração.
    if (env.NODE_ENV !== "production") {
        globalThis.prismaGlobal = prisma;
    }

    return prisma;
}