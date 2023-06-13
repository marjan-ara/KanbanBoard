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
import { IInputs } from '../generated/ManifestTypes'

// const authorityUrl = 'https://login.microsoftonline.com/common'

// const msalConfig = {
//   auth: {
//     authority: authorityUrl,
//     clientId: config.clientId,
//     clientSecret: config.secret
//     // knownAuthorities: ['login.microsoftonline.com']
//   }
// }

// const cca = new ConfidentialClientApplication(msalConfig)

// //function that acquires a token and passes it to DynamicsWebApi
// const acquireToken = (
//   dynamicsWebApiCallback: (arg0: string | undefined) => void
// ) => {
//   cca
//     .acquireTokenByClientCredential({
//       scopes: [`${config.serverUrl}/.default`]
//     })
//     .then((response) => {
//       //call DynamicsWebApi callback only when a token has been retrieved successfully
//       dynamicsWebApiCallback(response?.accessToken)
//     })
//     .catch((error) => {
//       console.log(JSON.stringify(error))
//     })
// }

// const xrmClient = new DynamicsWebApi({
//   webApiUrl: `${config.serverUrl}/api/data/v9.2/`,

//   onTokenRefresh: acquireToken
// })

// export const test = async () => {
//   try {
//     //call any function
//     const response = await xrmClient.executeUnboundFunction('WhoAmI')
//     console.log(`Hello Dynamics 365! My id is: ${response.UserId}`)
//   } catch (error) {
//     console.log(error)
//   }
// }

export const getWeekDays = (inputDate: Date): Date[] => {
  const first = inputDate.getDate() - inputDate.getDay() + 1 // First day is the day of the month - the day of the week
  const weekdays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(inputDate.setDate(first + i))
    weekdays.push(day)
  }
  return weekdays
}

export const getColumnCards = async (
  context: ComponentFramework.Context<IInputs>,
  date: Date,
  projectTasks: IProjectTask[]
): Promise<any> => {
  const output: IColumnItem[] = []
  const strDate = moment(date).format('YYYY-MM-DD')

  const sprinttasks = sprintTasks.value.filter(
    (item) =>
      item['arades_plannedstartdate'] !== null &&
      item['arades_plannedstartdate'].includes(strDate)
  )
  console.log(
    'sprintTasks.value[2].arades_plannedstartdate',
    sprintTasks.value[2]['arades_plannedstartdate'],
    'strDate:',
    strDate,
    sprintTasks.value[2]['arades_plannedstartdate']?.includes(strDate)
  )
  console.log('sprinttasksAfterFilter', sprinttasks)
  sprinttasks.forEach((el) => {
    let pt = projectTasks.find((item) => item.id === el['_arades_taskid_value'])
    console.log('pt', pt)

    if (!pt) {
      console.log('not pt')
      pt = {
        id: uuidv4(),
        name: 'Undefined',
        project: 'Undefined',
        feature: 'Undefined',
        estimatedDuration: 'Undefined',
        priority: 'Undefined',
        owner: 'Undefined'
      }
    }
    const st = {
      id: el['arades_sprinttaskid'],
      name: pt.name,
      project: pt.project,
      feature: pt.feature,
      estimatedDuration: pt.estimatedDuration,
      priority: pt.priority,
      owner: pt.owner
    }

    output.push({
      id: st.id,
      isProjectTask: false,
      projectTask: pt || null,
      sprintTask: st,
      isClosed: false
    })
    console.log('output', output)
  })
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
