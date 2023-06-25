/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { v4 as uuidv4 } from 'uuid'
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
  const weekdays = []
  var first = inputDate.getDate() - inputDate.getDay() + 1
  for (let i = 0; i < 7; i++) {
    var next = new Date(inputDate.getTime())
    next.setDate(first + i)

    weekdays.push(next)
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
  projectIds: string[],
  ownerIds: string[],
  featureIds: string[]
): Promise<any> => {
  const output: IColumnItem[] = []
  const formattedDate = date.toISOString().split('T')[0]
  const spTaskresult = await context.webAPI.retrieveMultipleRecords(
    'arades_sprinttask',
    `?$filter=statecode eq 0 and Microsoft.Dynamics.CRM.On(PropertyName=@p1,PropertyValue=@p2)&@p1='arades_plannedstartdate'&@p2='${formattedDate}'&$expand=arades_TaskId($select=arades_name,_arades_featureid_value,arades_estimatedduration,arades_priority;$expand=arades_FeatureId($select=arades_name),owninguser($select=fullname)),arades_ProjectId($select=arades_name),arades_SprintId($select=arades_name),owninguser($select=fullname)`
  )
  let sprinttasks = spTaskresult.entities

  if (projectIds.length > 0) {
    sprinttasks = sprinttasks.filter((x) =>
      projectIds.includes(x['arades_ProjectId'].arades_projectid)
    )
  }

  if (ownerIds.length > 0) {
    sprinttasks = sprinttasks.filter((x) =>
      ownerIds.includes(x['owninguser'].ownerid)
    )
  }

  if (featureIds.length > 0) {
    sprinttasks = sprinttasks.filter((x) =>
      featureIds.includes(x['arades_TaskId'].arades_FeatureId.arades_featureid)
    )
  }
  sprinttasks.forEach((el) => {
    const st: ISprintTask = {
      id: el['arades_sprinttaskid'],
      name: el['arades_name'] || 'undefined',
      project: el['arades_ProjectId'].arades_name,
      feature: el['arades_TaskId'].arades_FeatureId.arades_name,
      estimatedDuration: el['arades_estimatedduration'],
      priority: 'undefined',
      owner: el['owninguser'].fullname,
      sprintId: el['_arades_sprintid_value']
    }

    const pt: IProjectTask = {
      id: el['arades_TaskId'].arades_projecttaskid,
      name: el['arades_TaskId'].arades_name,
      project: el['arades_ProjectId'].arades_name,
      feature: el['arades_TaskId'].arades_FeatureId.arades_name,
      estimatedDuration: el['arades_TaskId'].arades_estimatedduration,
      priority: el['arades_TaskId'].arades_priority || 'undefined',
      owner: el['arades_TaskId'].owninguser.fullname,
      plannedStartDate: el['arades_plannedstartdate'] || null,
      plannedEndDate: el['arades_plannedstartdate'] || null
    }

    const card = {
      id: uuidv4(),
      projectId: el['arades_ProjectId'].arades_projectid,
      isProjectTask: false,
      projectTask: pt,
      sprintTask: st,
      isClosed: false
    }

    output.push(card)
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
    'arades_feature',
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
  name: string,
  projectId: string,
  projectTaskId: string,
  sprintId: string,
  startDate: Date,
  endDate: Date
): Promise<any> => {
  console.log(
    'create sprintTask input parameters: ',
    'projecId',
    projectId,
    'start date',
    startDate,
    'end date',
    endDate,
    'sprint id:',
    sprintId,
    'project task id',
    projectTaskId
  )

  const data = {
    arades_name: name,
    arades_plannedstartdate: startDate,
    arades_plannedenddate: endDate,
    'arades_ProjectId@odata.bind': `/arades_projects(${projectId})`,
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

  const data: any = {}
  if (estimatedDuration && !isNaN(estimatedDuration))
    data.arades_estimatedduration = estimatedDuration
  if (ownerId) data['ownerid@odata.bind'] = `/systemusers(${ownerId})`
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
  console.log(
    'update sprint task parameter: ',
    'sprintTaskId',
    sprintTaskId,
    'ownerId',
    ownerId,
    'estimatedDuration',
    estimatedDuration,
    'closeTask',
    closeTask
  )
  const data: any = {
    // arades_estimatedduration: estimatedDuration,
    // 'ownerid@odata.bind': `/systemusers(${ownerId})`
  }
  if (estimatedDuration && !isNaN(estimatedDuration))
    data.arades_estimatedduration = estimatedDuration
  if (ownerId) data['ownerid@odata.bind'] = `/systemusers(${ownerId})`
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

export const getWeekNumber = (date: Date) => {
  const startDate = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor(
    (date.valueOf() - startDate.valueOf()) / (24 * 60 * 60 * 1000)
  )
  var weekNumber = Math.ceil(days / 7)
  return weekNumber
}

export const createSprint = async (
  context: ComponentFramework.Context<IInputs>,
  projectId: string,
  date: Date
): Promise<any> => {
  const day = date.getDate() - date.getDay() + 1
  const firstDay = new Date(date.setDate(day))
  const lastDay = new Date(date.setDate(day + 6))
  const year = date.getFullYear()
  console.log('first day', firstDay)
  console.log('last day', lastDay)
  console.log('year', year)
  const weekNumber = getWeekNumber(firstDay) - 1 + 771840000
  const data = {
    'arades_ProjectId@odata.bind': `/arades_projects(${projectId})`,
    arades_year: year,
    arades_calendarweek: weekNumber,
    arades_startdate: firstDay.toISOString(),
    arades_enddate: lastDay.toISOString()
  }
  const result = await context.webAPI.createRecord('arades_sprint', data)
  const output = result.id
  console.log('created sprint id', output)
  return output
}

export const getSprintId = async (
  context: ComponentFramework.Context<IInputs>,
  projectId: string,
  date: Date
): Promise<string> => {
  const formattedDate = date.toISOString()
  console.log('input prameter date', formattedDate)

  const result = await context.webAPI.retrieveMultipleRecords(
    'arades_sprint',
    `?$filter=_arades_projectid_value eq '${projectId}' and arades_startdate le '${formattedDate}' and arades_enddate ge '${formattedDate}'`
  )

  console.log('get sprint id length', result.entities.length)
  /// find sprint of the project in which input date is between startDate and EndDate and return sprintId

  /// if it does not exists, create one and return sprintId

  if (result.entities.length > 0) {
    return result.entities[0].arades_sprintid
  }
  const res = await createSprint(context, projectId, date)
  console.log('create sprint res: ', res)
  return res
}

export const getProjectTasks = async (
  context: ComponentFramework.Context<IInputs>,
  projectIds: string[],
  ownerIds: string[],
  featureIds: string[]
): Promise<IColumnItem[]> => {
  const result = await context.webAPI.retrieveMultipleRecords(
    'arades_projecttask',
    '?$filter=statecode eq 0&$expand=arades_ProjectId($select=arades_name),arades_FeatureId($select=arades_name)'
  )
  let projTasks = result.entities
  console.log('projTasks', projTasks)
  if (projectIds.length > 0) {
    projTasks = projTasks.filter((item) =>
      projectIds.includes(item.arades_projecttaskid)
    )
  }

  if (ownerIds.length > 0) {
    projTasks = projTasks.filter((item) =>
      ownerIds.includes(item._ownerid_value)
    )
  }

  if (featureIds.length > 0) {
    projTasks = projTasks.filter((item) =>
      featureIds.includes(item._arades_featureid_value)
    )
  }

  console.log('projTasks', projTasks)
  const output = projTasks.map((el) => ({
    id: uuidv4(),
    projectId: el._arades_projectid_value,
    isProjectTask: false,
    projectTask: {
      id: el.arades_projecttaskid,
      name: el.arades_name || 'undefined',
      project: el['arades_ProjectId']
        ? el['arades_ProjectId'].arades_name
        : 'undefined',
      feature: el['arades_FeatureId']
        ? el['arades_FeatureId'].arades_name
        : 'undefined', // ptResult['arades_FeatureId'].arades_name,
      estimatedDuration: el.arades_estimatedduration,
      plannedStartDate: el.arades_plannedstartdate,
      plannedEndDate: el.arades_plannedenddate,
      priority: el['arades_priority'] || 'undefined',
      owner: 'undefined' // ptResult['owninguser'].fullname
    },
    sprintTask: null,
    isClosed: false
  }))
  console.log('filter output', output)
  return output
  // return active project tasks with these filters
}
