export interface IProjectTask {
  id: string
  name: string
  project: string
  feature: string
  estimatedDuration: string
  priority: string
  owner: string
}

export interface ISprintTask {
  id: string
  name: string
  project: string
  feature: string
  estimatedDuration: string
  priority: string
  owner: string
}

export interface IColumnItem {
  id: string
  isProjectTask: boolean
  projectTask: IProjectTask
  sprintTask: ISprintTask | null
  isClosed: boolean
}

export interface IOwner {
  id: string
  name: string
}

export interface IProject {
  id: string
  name: string
}
