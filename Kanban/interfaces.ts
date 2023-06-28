export interface IProjectTask {
  id: string
  name: string
  project: string
  feature: string
  estimatedDuration: string
  priority: string
  owner: string
  plannedStartDate: string | null
  plannedEndDate: string | null
}

export interface ISprintTask {
  id: string | null
  sprintId: string | null
  name: string
  project: string
  feature: string
  estimatedDuration: string
  priority: string
  owner: string
}

export interface IColumnItem {
  id: string
  projectId: string
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

export interface IFeature {
  id: string
  name: string
  projectId: string
}

export interface ISprint {
  id: string
  name: string
  startDate: Date
  endDate: Date
}
export interface ISprintFilter {
  projects: IProject[]
  features: IFeature[]
  owners: IOwner[]
}
