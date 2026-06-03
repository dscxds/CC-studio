import simpleGit from 'simple-git'

export async function checkIsGitRepo(projectPath: string): Promise<boolean> {
  try {
    const git = simpleGit(projectPath)
    return await git.checkIsRepo()
  } catch {
    return false
  }
}
