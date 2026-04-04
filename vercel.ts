export const config = {
    functions: {
        "**/*": {
            "includeFiles": "src/generated/prisma/**/*",
        }
    }
}