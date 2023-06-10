// import {
//   IColumnItem,
//   IOwner,
//   IProject,
//   IProjectTask,
//   ISprint,
//   ISprintTask
// } from '../interfaces'

// export const getActiveSprints = (): ISprint[] => {
//   // https://aradespsm.api.crm4.dynamics.com/api/data/v9.2/arades_sprints
//   const result = Xrm.WebApi.retrieveRecords(
//     'arades_sprint',
//     '?$filter=statecode eq 0'
//   )
//   return result.entities
// }

// export const getSprintTasks = (date: Date) => {
//   // get sprint tasks of a specific day
//   // get all active sprint tasks including projectId,projectName, ownerId,ownerName, featureId, featureName
//   const formattedDate = date.toISOString().split('T')[0]
//   const result = Xrm.WebApi.retrieveRecords(
//     'arades_sprinttask',
//     "?$filter=statecode eq 0 and Microsoft.Dynamics.CRM.On(PropertyName=@p1,PropertyValue=@p2)&@p1='arades_plannedstartdate'&@p2='${formattedDate}'"
//   )
//   return result.entities
// }

// export const getProjectTasks = () => {
//   //get all active and not-finished project tasks
//   const result = Xrm.WebApi.retrieveRecords(
//     'arades_projecttask',
//     '?$filter=statecode eq 0'
//   )
//   return result.entities
// }

// export const getOwners = () => {
//   // get all team members , I don't know if it is the contact entity or something else,
//   // I need person's name and id of those who can do a sprint task
//   const result = Xrm.WebApi.retrieveRecords(
//     'systemuser',
//     '?$filter=isdisabled eq false and islicensed eq true'
//   )
//   return result.entities
// }

// export const getProjects = () => {
//   // https://aradespsm.api.crm4.dynamics.com/api/data/v9.2/arades_projects
//   const result = Xrm.WebApi.retrieveRecords('arades_project', '?$select=*')
//   return result.entities
// }

// export const createSprintTask = (
//   projectTaskId: string,
//   sprintId: string,
//   startDate: Date,
//   endDate: Date
// ): string => {
//   const data = {
//     arades_plannedstartdate: startDate,
//     arades_plannedenddate: endDate,
//     'arades_SprintId@odata.bind': `/arades_sprints(${sprintId})`,
//     'arades_TaskId@odata.bind': `/arades_projecttasks(${projectTaskId})`
//   }
//   const result = await Xrm.WebApi.createRecord('arades_sprinttask', data)
//   return result.id
// }

// export const updateProjectTask = (
//   projectTaskId: number,
//   ownerId: string,
//   estimatedDuration: number,
//   closeTask: boolean
// ) => {
//   // find the project task with id
//   // update owner/ estimatedDuration
//   // if closeTask is true, deactivate project task
//   // return project task
//   const data = {
//     arades_estimatedduration: estimatedDuration,
//     'OwnerId@odata.bind': `/systemusers('${ownerId}')`
//   }
//   if (closeTask) {
//     data.statecode = 1
//     data.statuscode = 771840004
//   }
//   await Xrm.WebApi.updateRecord('arades_projecttask', projectTaskId, data)
//   const task = Xrm.WebApi.retrieveRecord(
//     'arades_projecttask',
//     projectTaskId,
//     '?$select=*'
//   )
//   return task
// }

// export const updateSprintTask = (
//   sprintTaskId: number,
//   ownerId: string,
//   estimatedDuration: number,
//   closeTask: boolean
// ) => {
//   // find the sprint task with id
//   // update owner/ estimatedDuration
//   // if closeTask is true, deactivate sprint task and its related project task
//   // return sprint task
//   const data = {
//     arades_estimatedduration: estimatedDuration,
//     'OwnerId@odata.bind': `/systemusers('${ownerId}')`
//   }
//   if (closeTask) {
//     data.statecode = 1
//     data.statuscode = 2
//   }
//   await Xrm.WebApi.updateRecord('arades_sprinttask', sprintTaskId, data)
//   const task = Xrm.WebApi.retrieveRecord(
//     'arades_sprinttask',
//     sprintTaskId,
//     '?$select=*'
//   )
//   if (closeTask) {
//     await Xrm.WebApi.updateRecord(
//       'arades_projecttask',
//       task._arades_taskid_value,
//       {
//         statecode: 1,
//         statuscode: 771840004
//       }
//     )
//   }
//   return task
// }

// export const deleteProjectTask = (projectTaskId: string) => {
//   // delete project task
//   // retutn if action was successful or not
//   try {
//     await Xrm.WebApi.deleteRecord('arades_projecttask', projectTaskId)
//     return true
//   } catch (error) {
//     return false
//   }
// }

// export const deleteSprintTask = (sprintTaskId: string) => {
//   // delete sprint task
//   // retutn if action was successful or not
//   try {
//     await Xrm.WebApi.deleteRecord('arades_sprinttask', sprintTaskId)
//     return true
//   } catch (error) {
//     return false
//   }
// }

// export const getSprintId = (projectId: string, date: Date): string => {
//   const formattedDate = date.toISOString()

//   const result = await Xrm.WebApi.retrieveRecord(
//     'arades_sprint',

//     `?$filter=_arades_projectid_value eq '${projectId}' arades_startdate ge '${formattedDate}' and arades_enddate le '${formattedDate}'`
//   )

//   /// find sprint of the project in which input date is between startDate and EndDate and return sprintId

//   /// if it does not exists, create one and return sprintId

//   return result.entities.length === 1
//     ? result.entities[0].arades_sprintid
//     : null
// }

// export const filterProjectTasks = (
//   projectIds: string[],
//   ownerIds: string[],
//   featureIds: string[],
//   priorities: number[]
// ) => {
//   // return active project tasks with these filters
// }

// export const filterSprintTasks = (
//   projectIds: string[],
//   ownerIds: string[],
//   featureIds: string[],
//   priorities: number[]
// ) => {
//   // return active sprint tasks with these filters
// }
