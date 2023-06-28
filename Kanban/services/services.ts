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
  IProjectTask,
  ISprintFilter
} from '../interfaces'
import sprintTasks from './sprint_tasks.json'
import owners from './contacts.json'
import projects from './projects.json'
import features from './features.json'
import sprints from './sprints.json'
import projectTasks from './project_tasks.json'
import resources from './resources.json'
import { IInputs } from '../generated/ManifestTypes'

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

export const getColumnCards = async (
  context: ComponentFramework.Context<IInputs>,
  date: Date,
  projectIds: string[],
  ownerIds: string[],
  featureIds: string[]
): Promise<any> => {
  const output: IColumnItem[] = []
  const formattedDate = date.toISOString().split('T')[0]

  setTimeout(() => {
    sprintTasks.value.forEach((el) => {
      const st = {
        id: el['arades_sprinttaskid'],
        name: el['arades_name'],
        project: el['arades_ProjectId']['arades_name'],
        feature: 'undefined',
        estimatedDuration: String(el['arades_estimatedduration']) || '',
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
    name: item['arades_name'],
    projectId: item['_arades_projectid_value']
  }))
  return output
}

export const updateProjectTask = (
  context: ComponentFramework.Context<IInputs>,
  sprintTaskId: string,
  ownerId: string | undefined,
  estimatedDuration: number | null,
  closeTask: boolean,
  plannedStartDate: Date,
  plannedEndDate: Date
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
  date: Date,
  projectName: string
): Promise<string> => {
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
  // const result = await context.webAPI.retrieveMultipleRecords(
  //   'arades_projecttask',
  //   '?$filter=statecode eq 0&$expand=arades_ProjectId($select=arades_name),arades_FeatureId($select=arades_name)'
  // )
  // let projTasks = result.entities
  let projTasks = projectTasks.value

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
    projTasks = projTasks.filter((item) => item.arades_FeatureId != null)
    projTasks = projTasks.filter((item) =>
      featureIds.includes(item._arades_featureid_value!)
    )
  }
  const output = projTasks.map((el) => ({
    id: uuidv4(),
    projectId: el._arades_projectid_value || 'undefined',
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
      estimatedDuration: 'undefined',
      priority: String(el['arades_priority']),
      plannedStartDate: el.arades_plannedstartdate,
      plannedEndDate: el.arades_plannedenddate,
      owner: 'undefined' // ptResult['owninguser'].fullname
    },
    sprintTask: null,
    isClosed: false
  }))

  return output
  // return active project tasks with these filters
}

export const openProjectTask = (projectTaskId: string) => {
  var entityFormOptions: any = {}
  entityFormOptions['entityName'] = 'arades_projecttask'
  entityFormOptions['entityId'] = projectTaskId

  // Open the form.
  Xrm.Navigation.openForm(entityFormOptions).then(
    function (success) {
      console.log(success)
    },
    function (error) {
      console.log(error)
    }
  )
}

export const openSprintTask = (sprintTaskId: string) => {
  var entityFormOptions: any = {}
  entityFormOptions['entityName'] = 'arades_sprinttask'
  entityFormOptions['entityId'] = sprintTaskId

  // Open the form.
  Xrm.Navigation.openForm(entityFormOptions).then(
    function (success) {
      console.log(success)
    },
    function (error) {
      console.log(error)
    }
  )
}

export const getSprintFilters = async (
  context: ComponentFramework.Context<IInputs>
): Promise<ISprintFilter> => {
  let sprinttasks = sprintTasks.value
  const projectFilters: IProject[] = []
  const featureFilters: IFeature[] = []
  const ownerFilters: IOwner[] = []

  sprinttasks.forEach((el) => {
    const pId = el['arades_ProjectId']
      ? el['arades_ProjectId'].arades_projectid
      : ''
    const pName = el['arades_ProjectId']
      ? el['arades_ProjectId'].arades_name
      : ''

    if (pId !== '' && !projectFilters.find((x) => x.id === pId))
      projectFilters.push({ id: pId, name: pName })

    const fId = ''

    const fName = ''
    const fProjectId = ''

    if (fId !== '' && !featureFilters.find((x) => x.id === fId))
      featureFilters.push({
        id: fId,
        name: fName,
        projectId: fProjectId
      })

    const oId = el['owninguser'] ? el['owninguser'].systemuserid : ''
    const oName = el['owninguser'] ? el['owninguser'].fullname : ''
    if (oName !== '' && !ownerFilters.find((x) => x.id === oId))
      ownerFilters.push({
        id: oId,
        name: oName
      })
  })

  const output: ISprintFilter = {
    projects: projectFilters,
    features: featureFilters,
    owners: ownerFilters
  }
  return output
}

export const getResourcesOfProject = async (
  context: ComponentFramework.Context<IInputs>,
  projectId: string
): Promise<IOwner[]> => {
  const result = resources
  let ownersValue = result.value
  const output = ownersValue.map((item) => ({
    id: item._arades_userid_value,
    name: item.arades_name
  }))
  return output
}
