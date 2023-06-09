import {
  IColumnItem,
  IOwner,
  IProject,
  IProjectTask,
  ISprintTask
} from '../interfaces'


export const getActiveSprints = (): ISprint[] => {
  // https://aradespsm.api.crm4.dynamics.com/api/data/v9.2/arades_sprints
}

export const getSprintTasks = (date:Date) => {
    // get sprint tasks of a specific day
  // get all active sprint tasks including projectId,projectName, ownerId,ownerName, featureId, featureName
}

export const getProjectTasks=()=>{
    //get all active and not-finished project tasks
}

export const getOwners=()=>{
    // get all team members , I don't know if it is the contact entity or something else, 
    // I need person's name and id of those who can do a sprint task
}

export const getProjects=()=>{
    // https://aradespsm.api.crm4.dynamics.com/api/data/v9.2/arades_projects
}

export const createSprintTask(projectTaskId:string, sprintId:string,startDate:Date,endDate:Date):string=>{
    const id = createdSprintTaskId
    return id 
}

export const updateProjectTask=(projectTaskId:number,ownerId:string, estimatedDuration:number,closeTask:boolean)=>{
    // find the project task with id
    // update owner/ estimatedDuration
    // if closeTask is true, deactivate project task
    // return project task
}


export const updateSprintTask=(sprintTaskId:number,ownerId:string, estimatedDuration:number,closeTask:boolean)=>{
    // find the sprint task with id
    // update owner/ estimatedDuration
    // if closeTask is true, deactivate sprint task and its related project task
    // return sprint task
}

export const deleteProjectTask(projectTaskId:string)=>{
    // delete project task
    // retutn if action was successful or not
}


export const deleteSprintTask(sprintTaskId:string)=>{
    // delete sprint task
    // retutn if action was successful or not
}