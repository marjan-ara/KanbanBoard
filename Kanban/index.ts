/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
import { IInputs, IOutputs } from './generated/ManifestTypes'
import * as React from 'react'

import DynamicsWebApi from 'dynamics-web-api'
import { IColumnItem } from './interfaces'
import { getColumnCards, getWeekDays } from './services/xrmServices'
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
        id: recordId,
        isProjectTask: true,
        projectTask: {
          id: String(
            dataSet.records[recordId].getValue('arades_projecttaskid')
          ),
          name: String(dataSet.records[recordId].getValue('arades_name')),
          project: String(
            dataSet.records[recordId].getValue('_arades_projectid_name')
          ),
          feature: String(
            dataSet.records[recordId].getValue('_arades_featureid_name')
          ),
          estimatedDuration: String(
            dataSet.records[recordId].getValue('arades_estimatedduration')
          ),
          priority: String(
            dataSet.records[recordId].getValue('arades_priority')
          ),
          owner: String(dataSet.records[recordId].getValue('_ownerid_name'))
        },
        sprintTask: null,
        isClosed: false
      })
    })
    weekDays.forEach((element, index) => {
      const projecttasks = taskListVar[0].map((item) => item.projectTask)
      // const colCards = getColumnCards(element, projecttasks)
      // taskListVar[1 + index] = colCards

      getColumnCards(context, element, projecttasks).then(
        (res) => (taskListVar[1 + index] = res.colCards)
      )
    })
    // this.dispatch(updateBoard(taskListVar))
    this._taskList = [...taskListVar]
    this._props.taskList = [...taskListVar]
    this._props.weekdays = weekDays
    this._props.context = context

    console.log('update view props', this._props)

    return React.createElement(KanbanView, this._props)
  }

  private notifyChange(newList: IColumnItem[][]) {
    this._taskList = newList
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
