/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/dot-notation */
// import config from './config.json'
// import { ConfidentialClientApplication } from '@azure/msal-node'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import {
  IColumnItem,
  IFeature,
  IOwner,
  IProject,
  IProjectTask
} from '../interfaces'
import sprintTasks from './sprint_tasks.json'
import owners from './contacts.json'
import projects from './projects.json'
import features from './features.json'
import sprints from './sprints.json'
import { IInputs } from '../generated/ManifestTypes'

export const getWeekDays = (inputDate: Date): Date[] => {
  const weekdays = []
  var first = inputDate.getDate() - inputDate.getDay() + 1
  for (let i = 0; i < 7; i++) {
    var next = new Date(inputDate.getTime())
    next.setDate(first + i)
    console.log('first day', first, 'day ', i, next)
    weekdays.push(next)
  }
  return weekdays
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
  console.log('formattedDate', formattedDate)

  setTimeout(() => {
    sprintTasks.value.forEach((el) => {
      const st = {
        id: el['arades_sprinttaskid'],
        name: el['arades_name'],
        project: el['arades_ProjectId']['arades_name'],
        feature: 'undefined',
        estimatedDuration: el['arades_estimatedduration'] || 'undefined',
        priority: 'undefined',
        owner: el['owninguser'].fullname,
        sprintId: el['_arades_sprintid_value']
      }

      const pt: IProjectTask = {
        id: el['arades_ProjectId'].arades_projectid,
        name: el['arades_name'],
        project: el['arades_ProjectId']['arades_name'],
        feature: 'undefined',
        estimatedDuration: 'undefined',
        priority: 'undefined',
        owner: 'undefined',
        plannedStartDate: el['arades_plannedstartdate'] || null,
        plannedEndDate: el['arades_plannedstartdate'] || null
      }

      output.push({
        id: uuidv4(),
        projectId: el['arades_ProjectId'].arades_projectid,
        isProjectTask: false,
        projectTask: pt,
        sprintTask: st,
        isClosed: false
      })
    })
    console.log('output', output)
  }, 5000)

  return output
}

export const getOwners = (
  context: ComponentFramework.Context<IInputs>
): IOwner[] => {
  const output = owners.value.map((item) => ({
    id: item.contactid,
    name: item.fullname
  }))
  return output
}

export const getFeatures = (
  context: ComponentFramework.Context<IInputs>
): IFeature[] => {
  const output = features.value.map((item) => ({
    id: item['arades_featureid'],
    name: item['arades_name']
  }))
  return output
}

export const updateProjectTask = (
  context: ComponentFramework.Context<IInputs>,
  sprintTaskId: string,
  ownerId: string | undefined,
  estimatedDuration: number | null,
  closeTask: boolean
) => {
  return null
}

export const updateSprintTask = (
  context: ComponentFramework.Context<IInputs>,
  sprintTaskId: string,
  ownerId: string | undefined,
  estimatedDuration: number | null,
  closeTask: boolean
) => {
  return null
}

export const deleteProjectTask = (
  context: ComponentFramework.Context<IInputs>,
  id: string
) => {
  return null
}
export const deleteSprintTask = (
  context: ComponentFramework.Context<IInputs>,
  id: string
) => {
  return null
}

export const createSprintTask = (
  context: ComponentFramework.Context<IInputs>,
  name: string,
  projectId: string,
  projectTaskId: string,
  sprintId: string,
  startDate: Date,
  endDate: Date
): string => {
  const output = uuidv4()
  // const sprintId = '0000000'
  // return new Promise((resolve, reject) => {
  //   resolve(output)
  // })
  return output
}

export const getProjects = (
  context: ComponentFramework.Context<IInputs>
): IProject[] => {
  const res = projects.value.map((item) => ({
    id: item['arades_projectid'],
    name: item['arades_name']
  }))
  return res
}

export const getSprintId = async (
  context: ComponentFramework.Context<IInputs>,
  projectId: string,
  date: Date
): Promise<string> => {
  console.log('get sprint id', projectId, date)
  const sp = await sprints.value.find(
    (x) =>
      x._arades_projectid_value === projectId &&
      date >= new Date(x.arades_startdate) &&
      date <= new Date(x.arades_enddate)
  )
  let result = ''
  if (sp) result = sp.arades_sprintid
  else result = ''
  return result
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
      priority: el['arades_priority'] || 'undefined',
      plannedStartDate: el.arades_plannedstartdate,
      plannedEndDate: el.arades_plannedenddate,
      owner: 'undefined' // ptResult['owninguser'].fullname
    },
    sprintTask: null,
    isClosed: false
  }))
  console.log('filter output', output)
  return output
  // return active project tasks with these filters
}
