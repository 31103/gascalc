/**
 * dist/.temp ディレクトリを再帰的に削除するスクリプト。
 */
async function cleanTempDir(): Promise<void> {
  const tempDirPath = "dist/.temp";
  try {
    await Deno.remove(tempDirPath, { recursive: true });
    console.log(`Successfully removed ${tempDirPath}`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(`${tempDirPath} not found, nothing to remove.`);
    } else {
      console.error(`Error removing ${tempDirPath}:`, error);
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  await cleanTempDir();
}
