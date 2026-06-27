import { z } from "zod";

/**
 * Schema de validação das variáveis de ambiente.
 *
 * Garante em tempo de inicialização que todas as variáveis necessárias
 * estão presentes e com valores válidos, evitando falhas silenciosas
 * em runtime.
 */
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
});

/**
 * Valida process.env contra o schema sem lançar exceção imediatamente,
 * permitindo coletar e exibir todos os erros antes de interromper a execução.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Variáveis de ambiente inválidas:");

    // Formata os erros em uma estrutura aninhada por campo para facilitar o debug
    const formatted = parsed.error.format();
    console.error(JSON.stringify(formatted, null, 2));

    // Extrai apenas os campos que possuem erros, ignorando "_errors" (erros globais do schema)
    const missingFields = Object.keys(formatted)
        .filter((key) => key !== "_errors")
        .filter((key) => {
            const field = formatted[key as keyof typeof formatted];
            return (
                field && "_errors" in field && field._errors && field._errors.length > 0
            );
        });

    if (missingFields.length > 0) {
        console.error("📋 Campos com erro:", missingFields);
    }

    // Interrompe a inicialização da aplicação para evitar execução em estado inválido
    throw new Error("Variáveis de ambiente inválidas");
}

/**
 * Variáveis de ambiente validadas e tipadas.
 *
 * Use este objeto em vez de `process.env` diretamente para garantir
 * type safety e autocompletar no editor.
 *
 * @example
 * import { env } from "@/config/env.config";
 * console.log(env.DATABASE_URL);
 */
export const env = parsed.data;