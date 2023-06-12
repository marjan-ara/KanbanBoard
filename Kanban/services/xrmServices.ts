/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicsWebApi from 'dynamics-web-api'
import * as MSAL from '@azure/msal-node'
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

//OAuth Token Endpoint (from your Azure App Registration)
const authorityUrl =
  'https://login.microsoftonline.com/ed0e8c26-74ad-4757-b665-2ba44592d33b'

const msalConfig = {
  auth: {
    authority: authorityUrl,
    clientId: '8c2d97aa-c48c-4dfe-a26e-82d8fd0eeaeb',
    clientSecret: 'uCB8Q~uKOzLPwa7dvmAqn5h92--7EdrjQ7I_Ga59',
    knownAuthorities: ['login.microsoftonline.com']
  }
}

const cca = new MSAL.ConfidentialClientApplication(msalConfig)
const serverUrl = 'https://aradespsmdev.api.crm.dynamics.com'

//function that acquires a token and passes it to DynamicsWebApi
const acquireToken = (dynamicsWebApiCallback: any) => {
  cca
    .acquireTokenByClientCredential({
      scopes: [`${serverUrl}/.default`]
    })
    .then((response) => {
      //call DynamicsWebApi callback only when a token has been retrieved successfully
      if (response != null) {
        dynamicsWebApiCallback(response.accessToken)
      }
    })
    .catch((error) => {
      console.log(JSON.stringify(error))
    })
}

//create DynamicsWebApi
const dynamicsWebApi = new DynamicsWebApi({
  serverUrl: serverUrl,
  dataApi: {
    version: '9.2'
  },
  onTokenRefresh: acquireToken
})

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
  const result = await dynamicsWebApi.retrieveMultipleRequest({
    collection: 'arades_springs',
    filter: 'statecode eq 0'
  })
  const output = result.value.map((x) => ({
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
  const result = await dynamicsWebApi.retrieveMultipleRequest({
    collection: 'arades_sprinttasks',
    filter:
      "statecode eq 0 and Microsoft.Dynamics.CRM.On(PropertyName=@p1,PropertyValue=@p2)&@p1='arades_plannedstartdate'&@p2='${formattedDate}'"
  })
  const sprinttasks = result.value

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
  const result = await dynamicsWebApi.retrieveMultipleRequest({
    collection: 'systemusers',
    filter: 'isdisabled eq false and islicensed eq true'
  })
  const output = result.value.map((x) => ({
    id: x.systemuserid,
    name: x.fullname
  }))
  return output
}

export const getProjects = async (
  context: ComponentFramework.Context<IInputs>
): Promise<IProject[]> => {
  // https://aradespsm.api.crm4.dynamics.com/api/data/v9.2/arades_projects
  const result = await dynamicsWebApi.retrieveMultipleRequest({
    collection: 'arades_projects'
  })
  const output = result.value.map((x) => ({
    id: x.arades_projectid,
    name: x.arades_name
  }))
  return output
}
export const getFeatures = async (
  context: ComponentFramework.Context<IInputs>
): Promise<IFeature[]> => {
  const result = await dynamicsWebApi.retrieveMultipleRequest({
    collection: 'arades_features'
  })
  const output = result.value.map((x) => ({
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
  const result = await dynamicsWebApi.createRequest({
    collection: 'arades_sprinttasks',
    entity: data
  })
  return result // TODO just id
}

export const updateProjectTask = async (
  context: ComponentFramework.Context<IInputs>,
  projectTaskId: string,
  ownerId: string,
  estimatedDuration: number,
  closeTask: boolean
): Promise<any> => {
  // find the project task with id
  // update owner/ estimatedDuration
  // if closeTask is true, deactivate project task
  // return project task

  const data: {
    arades_estimatedduration: number
    'OwnerId@odata.bind': string
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

  await dynamicsWebApi.updateRequest({
    collection: 'arades_projecttasks',
    key: projectTaskId,
    entity: data
  })
  const task = dynamicsWebApi.retrieveRequest({
    collection: 'arades_projecttasks',
    key: projectTaskId
  })
  return task
}

export const updateSprintTask = async (
  context: ComponentFramework.Context<IInputs>,
  sprintTaskId: string,
  ownerId: string,
  estimatedDuration: number,
  closeTask: boolean
): Promise<any> => {
  // find the sprint task with id
  // update owner/ estimatedDuration
  // if closeTask is true, deactivate sprint task and its related project task
  // return sprint task
  const data: {
    arades_estimatedduration: number
    'OwnerId@odata.bind': string
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
  await dynamicsWebApi.updateRequest({
    collection: 'arades_sprinttasks',
    key: sprintTaskId,
    entity: data
  })

  const task = await dynamicsWebApi.retrieveRequest({
    collection: 'arades_sprinttasks',
    key: sprintTaskId
  })
  if (closeTask) {
    await dynamicsWebApi.updateRequest({
      collection: 'arades_projecttasks',
      key: task._arades_taskid_value,
      entity: {
        statecode: 1,
        statuscode: 771840004
      }
    })
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
    await dynamicsWebApi.deleteRequest({
      collection: 'arades_projecttasks',
      key: projectTaskId
    })
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
    await dynamicsWebApi.deleteRequest({
      collection: 'arades_sprinttasks',
      key: sprintTaskId
    })
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

  const result = await dynamicsWebApi.retrieveMultipleRequest({
    collection: 'arades_sprints',
    filter: `_arades_projectid_value eq '${projectId}' arades_startdate ge '${formattedDate}' and arades_enddate le '${formattedDate}'`
  })

  /// find sprint of the project in which input date is between startDate and EndDate and return sprintId

  /// if it does not exists, create one and return sprintId

  return result.value.length === 1 ? result.value[0].arades_sprintid : null
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
