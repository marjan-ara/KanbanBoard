/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { IInputs } from '../generated/ManifestTypes'
import {
  IColumnItem,
  IFeature,
  IOwner,
  IProject,
  IProjectTask,
  ISprint,
  ISprintTask
} from '../interfaces'

export const getWeekDays = (inputDate: Date): Date[] => {
  const first = inputDate.getDate() - inputDate.getDay() + 1 // First day is the day of the month - the day of the week
  const weekdays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(inputDate.setDate(first + i))
    weekdays.push(day)
  }
  return weekdays
}

export const getActiveSprints = async (
  context: ComponentFramework.Context<IInputs>
): Promise<any> => {
  // https://aradespsm.api.crm4.dynamics.com/api/data/v9.2/arades_sprints
  const result = await context.webAPI.retrieveMultipleRecords(
    'arades_sprint',
    '?$filter=statecode eq 0'
  )
  const output = result.entities.map((x) => ({
    id: x.arades_sprintid,
    name: x.arades_name,
    startDate: new Date(x.arades_startdate),
    endDate: new Date(x.arades_enddate)
  }))
  return output
}

export const getColumnCards = async (
  context: ComponentFramework.Context<IInputs>,
  date: Date,
  projectTasks: IProjectTask[]
): Promise<any> => {
  const output: IColumnItem[] = []
  const strDate = String(date).substring(0, 10)
  const formattedDate = date.toISOString().split('T')[0]
  const result = await context.webAPI.retrieveMultipleRecords(
    'arades_sprinttask',
    "?$filter=statecode eq 0 and Microsoft.Dynamics.CRM.On(PropertyName=@p1,PropertyValue=@p2)&@p1='arades_plannedstartdate'&@p2='${formattedDate}'"
  )
  const sprinttasks = result.entities

  sprinttasks.forEach((el) => {
    const pt = projectTasks.find(
      (item) => item.id === el['_arades_taskid_value']
    )
    if (pt !== undefined) {
      const st = {
        id: el['arades_sprinttaskid'],
        name: el['arades_name'],
        project: pt?.project,
        feature: pt?.feature,
        estimatedDuration: pt?.estimatedDuration,
        priority: pt?.priority,
        owner: pt?.owner
      }

      output.push({
        id: st.id,
        isProjectTask: false,
        projectTask: pt,
        sprintTask: st,
        isClosed: false
      })
    }
  })
  return output
}

export const getOwners = async (
  context: ComponentFramework.Context<IInputs>
): Promise<IOwner[]> => {
  // get all team members , I don't know if it is the contact entity or something else,
  // I need person's name and id of those who can do a sprint task
  const result = await context.webAPI.retrieveMultipleRecords(
    'systemuser',
    '?$filter=isdisabled eq false and islicensed eq true'
  )
  const output = result.entities.map((x) => ({
    id: x.systemuserid,
    name: x.fullname
  }))
  return output
}

export const getProjects = async (
  context: ComponentFramework.Context<IInputs>
): Promise<IProject[]> => {
  // https://aradespsm.api.crm4.dynamics.com/api/data/v9.2/arades_projects
  const result = await context.webAPI.retrieveMultipleRecords(
    'arades_project',
    '?$select=*'
  )
  const output = result.entities.map((x) => ({
    id: x.arades_projectid,
    name: x.arades_name
  }))
  return output
}
export const getFeatures = async (
  context: ComponentFramework.Context<IInputs>
): Promise<IFeature[]> => {
  const result = await context.webAPI.retrieveMultipleRecords(
    'arades_features',
    '?$select=*'
  )
  const output = result.entities.map((x) => ({
    id: x['arades_featureid'],
    name: x['arades_name']
  }))
  return output
}

export const createSprintTask = async (
  context: ComponentFramework.Context<IInputs>,
  projectTaskId: string,
  sprintId: string,
  startDate: Date,
  endDate: Date
): Promise<any> => {
  const data = {
    arades_plannedstartdate: startDate,
    arades_plannedenddate: endDate,
    'arades_SprintId@odata.bind': `/arades_sprints(${sprintId})`,
    'arades_TaskId@odata.bind': `/arades_projecttasks(${projectTaskId})`
  }
  const result = await context.webAPI.createRecord('arades_sprinttask', data)
  const output = result.id
  return output
}

export const updateProjectTask = async (
  context: ComponentFramework.Context<IInputs>,
  projectTaskId: string,
  ownerId: string | undefined,
  estimatedDuration: number | null,
  closeTask: boolean
): Promise<any> => {
  // find the project task with id
  // update owner/ estimatedDuration
  // if closeTask is true, deactivate project task
  // return project task

  const data: {
    arades_estimatedduration: number | null
    'OwnerId@odata.bind': string | undefined
    statecode: number | null
    statuscode: number | null
  } = {
    arades_estimatedduration: estimatedDuration,
    'OwnerId@odata.bind': `/systemusers('${ownerId}')`,
    statecode: null,
    statuscode: null
  }
  if (closeTask) {
    data.statecode = 1
    data.statuscode = 771840004
  }
  await context.webAPI.updateRecord('arades_projecttask', projectTaskId, data)
  const task = context.webAPI.retrieveRecord(
    'arades_projecttask',
    projectTaskId,
    '?$select=*'
  )
  return task
}

export const updateSprintTask = async (
  context: ComponentFramework.Context<IInputs>,
  sprintTaskId: string,
  ownerId: string | undefined,
  estimatedDuration: number | null,
  closeTask: boolean
): Promise<any> => {
  // find the sprint task with id
  // update owner/ estimatedDuration
  // if closeTask is true, deactivate sprint task and its related project task
  // return sprint task
  const data: {
    arades_estimatedduration: number | null
    'OwnerId@odata.bind': string | undefined
    statecode: number | null
    statuscode: number | null
  } = {
    arades_estimatedduration: estimatedDuration,
    'OwnerId@odata.bind': `/systemusers('${ownerId}')`,
    statecode: null,
    statuscode: null
  }
  if (closeTask) {
    data.statecode = 1
    data.statuscode = 2
  }
  await context.webAPI.updateRecord('arades_sprinttask', sprintTaskId, data)
  const task = await context.webAPI.retrieveRecord(
    'arades_sprinttask',
    sprintTaskId,
    '?$select=*'
  )
  if (closeTask) {
    await context.webAPI.updateRecord(
      'arades_projecttask',
      task._arades_taskid_value,
      {
        statecode: 1,
        statuscode: 771840004
      }
    )
  }
  return task
}

export const deleteProjectTask = async (
  context: ComponentFramework.Context<IInputs>,
  projectTaskId: string
): Promise<any> => {
  // delete project task
  // retutn if action was successful or not
  try {
    await context.webAPI.deleteRecord('arades_projecttask', projectTaskId)
    return true
  } catch (error) {
    return false
  }
}

export const deleteSprintTask = async (
  context: ComponentFramework.Context<IInputs>,
  sprintTaskId: string
): Promise<any> => {
  // delete sprint task
  // retutn if action was successful or not
  try {
    await context.webAPI.deleteRecord('arades_sprinttask', sprintTaskId)
    return true
  } catch (error) {
    return false
  }
}

export const getSprintId = async (
  context: ComponentFramework.Context<IInputs>,
  projectId: string,
  date: Date
): Promise<any> => {
  const formattedDate = date.toISOString()

  const result = await context.webAPI.retrieveRecord(
    'arades_sprint',

    `?$filter=_arades_projectid_value eq '${projectId}' arades_startdate ge '${formattedDate}' and arades_enddate le '${formattedDate}'`
  )

  /// find sprint of the project in which input date is between startDate and EndDate and return sprintId

  /// if it does not exists, create one and return sprintId

  return result.entities.length === 1
    ? result.entities[0].arades_sprintid
    : null
}

export const filterProjectTasks = async (
  projectIds: string[],
  ownerIds: string[],
  featureIds: string[],
  priorities: number[]
): Promise<any> => {
  // return active project tasks with these filters
}

export const filterSprintTasks = async (
  projectIds: string[],
  ownerIds: string[],
  featureIds: string[],
  priorities: number[]
): Promise<any> => {
  // return active sprint tasks with these filters
}
