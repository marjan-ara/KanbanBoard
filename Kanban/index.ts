/* eslint-disable @typescript-eslint/no-useless-constructor */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
import * as React from 'react'
import { v4 as uuidv4 } from 'uuid'
import { IInputs, IOutputs } from './generated/ManifestTypes'
import { IColumnItem } from './interfaces'
import {
  getColumnCards,
  getWeekDays,
  getWeekNumber
} from './services/xrmServices'
// import { getColumnCards, getWeekDays } from './services/services'
import KanbanView, {
  IKanbanViewProps
} from './components/kanbanView/KanbanView'

export class Kanban
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
  private theComponent: ComponentFramework.ReactControl<IInputs, IOutputs>

  private _context: ComponentFramework.Context<IInputs>

  private _taskList: IColumnItem[][]

  private _weekDays: Date[]

  private notifyOutputChanged: () => void

  private _props: IKanbanViewProps = {
    //properties
    taskList: [],
    weekdays: [],
    //callback function
    onChange: this.notifyChange.bind(this),
    context: null
  }

  /**
   * Empty constructor.
   */
  constructor() {}

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
   * Data-set values are not initialized here, use updateView.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    this._context = context

    this.notifyOutputChanged = notifyOutputChanged
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   * @returns ReactElement root react element for the control
   */
  public updateView(
    context: ComponentFramework.Context<IInputs>
  ): React.ReactElement {
    const dataSet = this._context.parameters.taskListDataSet
    const weekDays: Date[] = getWeekDays(new Date())
    const taskListVar: IColumnItem[][] = [[], [], [], [], [], [], [], []]

    dataSet.sortedRecordIds.forEach((recordId) => {
      taskListVar[0].push({
        id: uuidv4(),
        isProjectTask: true,
        projectId: Object(
          dataSet.records[recordId].getValue('arades_projectid')
        )?.id?.guid,
        projectTask: {
          id: String(recordId),
          name: String(dataSet.records[recordId].getValue('arades_name') || ''),
          project: String(
            dataSet.records[recordId].getFormattedValue(
              'arades_projectid' || ''
            )
          ),
          feature: String(
            dataSet.records[recordId].getFormattedValue('arades_featureid') ||
              ''
          ),
          estimatedDuration: String(
            dataSet.records[recordId].getValue('arades_estimatedduration') || ''
          ),
          priority: String(
            dataSet.records[recordId].getValue('arades_priority') || ''
          ),
          owner: String(
            dataSet.records[recordId].getFormattedValue('ownerid') || ''
          ),
          plannedStartDate: String(
            dataSet.records[recordId].getValue('arades_plannedstartdate')
          ),

          plannedEndDate: String(
            dataSet.records[recordId].getValue('arades_plannedenddate')
          )
        },
        sprintTask: null,
        isClosed: false
      })
    })

    this._taskList = [...taskListVar]
    this._weekDays = weekDays
    this._props.taskList = [...taskListVar]
    this._props.weekdays = weekDays
    this._props.context = context

    return React.createElement(KanbanView, this._props)

    // this.dispatch(updateBoard(taskListVar))
  }

  private notifyChange(newList: IColumnItem[][], newWeekDays: Date[]) {
    const newTaskList = [...newList]
    newWeekDays.forEach((element, index) => {
      const projecttasks = newTaskList[0].map((item) => item.projectTask)
      // const colCards = getColumnCards(element, projecttasks)
      // taskListVar[1 + index] = colCards

      getColumnCards(this._context, element, [], [], []).then((res) => {
        newTaskList[1 + index] = res
      })
    })

    this._taskList = newTaskList
    this._weekDays = newWeekDays
    this.notifyOutputChanged()
  }
  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
   */
  //   public getOutputs(): IOutputs {
  //     return {
  //       taskListDataSet: this._taskList
  //     }
  //   }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    // Add code to cleanup control if necessary
  }
}
