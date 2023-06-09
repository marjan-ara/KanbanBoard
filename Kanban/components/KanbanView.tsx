/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import {
  ComboBox,
  ContextualMenu,
  DefaultButton,
  IComboBox,
  IComboBoxOption,
  IContextualMenuListProps,
  IContextualMenuProps,
  IIconProps,
  IRenderFunction,
  registerIcons,
  TextField,
  ThemeProvider
} from '@fluentui/react'
import { FilterIcon } from '@fluentui/react-icons-mdl2'
import moment from 'moment'
import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableLocation,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot
} from 'react-beautiful-dnd'
import { Provider } from 'react-redux'
import { IColumnItem, IProject } from '../interfaces'
import store from '../redux/store'
import {
  createSprintTask,
  deleteSprintTask,
  getProjects
} from '../services/services'
import './KanbanView.css'
import TaskCard from './TaskCard'

registerIcons({
  icons: {
    filterIcon: <FilterIcon />
  }
})
const filterIcon: IIconProps = { iconName: 'filterIcon' }
const filterMenuProps: IContextualMenuProps = {
  items: [
    {
      key: 'project',
      text: 'Project'
    },
    {
      key: 'owner',
      text: 'Owner'
    }
  ],
  directionalHintFixed: true
}

function _getMenu(props: IContextualMenuProps): JSX.Element {
  // Customize contextual menu with menuAs
  return <ContextualMenu {...props} />
}

export interface IKanbanViewProps {
  // appContext: ComponentFramework.Context<IInputs>;
  taskList: IColumnItem[][]
  weekdays: Date[]
  onChange: (taskList: IColumnItem[][]) => void
}

interface IMoveResult {
  droppable: IColumnItem[]
  droppable2: IColumnItem[]
}

const reorder = (
  list: IColumnItem[],
  startIndex: number,
  endIndex: number
): IColumnItem[] => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

const move = (
  source: IColumnItem[],
  destination: IColumnItem[],
  droppableSource: DraggableLocation,
  droppableDestination: DraggableLocation,
  sIndex: number,
  dIndex: number
): IMoveResult | any => {
  const sourceClone = Array.from(source)
  const destClone = Array.from(destination)

  const removed = sourceClone[droppableSource.index]
  console.log('remoced', removed)
  // destClone.splice(droppableDestination.index, 0, removed)

  if (sIndex === 0 && dIndex > 0) {
    const stId = createSprintTask()
    removed.id = stId
    removed.isProjectTask = false
    removed.sprintTask = {
      id: stId,
      name: removed.projectTask.name,
      project: removed.projectTask.project,
      feature: removed.projectTask.feature,
      estimatedDuration: removed.projectTask.estimatedDuration,
      priority: removed.projectTask.priority,
      owner: removed.projectTask.owner
    }
  } else if (sIndex > 0 && dIndex === 0) {
    removed.id = removed.projectTask.id
    removed.sprintTask = null
    deleteSprintTask(removed.id)
  } else {
    console.log('sIndex > 0 && dIndex >0')
    deleteSprintTask(removed.id)
    const stId = createSprintTask()
    removed.id = stId
    removed.sprintTask = {
      id: stId,
      name: removed.projectTask.name,
      project: removed.projectTask.project,
      feature: removed.projectTask.feature,
      estimatedDuration: removed.projectTask.estimatedDuration,
      priority: removed.projectTask.priority,
      owner: removed.projectTask.owner
    }
  }
  sourceClone.splice(droppableSource.index, 1)
  destClone.splice(droppableDestination.index, 0, removed)
  const result: IMoveResult | any = {}
  result[droppableSource.droppableId] = sourceClone
  result[droppableDestination.droppableId] = destClone

  return result
}

const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  // change background colour if dragging
  background: isDragging ? 'aliceblue' : '',

  // styles we need to apply on draggables
  ...draggableStyle
})
const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? 'lightblue' : ''
})

const KanbanView: React.FC<IKanbanViewProps> = (props) => {
  const [list, setList] = useState(props.taskList)
  const [searchProject, setSearchProject] = useState('')
  const [featureSearch, setFeatureSearch] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [finishDateSearch, setFinishDateSearch] = useState('')
  const [prioritySearch, setPrioritySearch] = useState('')
  const projects = getProjects()
  const projectOptions = projects.map((p) => ({
    key: p.id,
    text: p.name
  }))
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>(
    []
  )
  const onChangeProjectFilter = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected
    if (option) {
      setSelectedProjectIds((prevSelectedKeys) =>
        selected
          ? [...prevSelectedKeys, option!.key as string]
          : prevSelectedKeys.filter((k) => k !== option!.key)
      )
    }
  }

  const renderMenuList = (
    menuListProps: IContextualMenuListProps,
    defaultRender: IRenderFunction<IContextualMenuListProps>
  ) => {
    return (
      <div>
        <div style={{ borderBottom: '1px solid #ccc' }}>
          <ComboBox
            multiSelect
            selectedKey={selectedProjectIds}
            options={projectOptions}
            onChange={onChangeProjectFilter}
          />
        </div>
        {defaultRender(menuListProps)}
      </div>
    )
  }

  useEffect(() => {
    console.log('list', list)
    if (list !== props.taskList) {
      props.onChange(list)
    }
  }, [list])

  useEffect(() => {
    if (list !== props.taskList) {
      setList(props.taskList)
    }
  }, [props.taskList])

  function onDragEnd(result: DropResult): void {
    const { source, destination } = result

    // dropped outside the list
    if (!destination) {
      return
    }
    const sInd = +source.droppableId
    const dInd = +destination.droppableId

    if (sInd === dInd) {
      const items = reorder(list[sInd], source.index, destination.index)
      const newState = [...list]
      newState[sInd] = items
      setList(newState)
    } else {
      const result = move(
        list[sInd],
        list[dInd],
        source,
        destination,
        sInd,
        dInd
      )
      const newState = [...list]
      newState[sInd] = result[sInd]
      newState[dInd] = result[dInd]
      setList(newState)
    }
  }

  const onChangeSearchProjectValue = React.useCallback(
    (
      event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
      newValue?: string
    ) => {
      setSearchProject(newValue || '')
    },
    []
  )
  const onChangeSearchFeatureValue = React.useCallback(
    (
      event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
      newValue?: string
    ) => {
      setSearchProject(newValue || '')
    },
    []
  )

  return (
    <ThemeProvider>
      <Provider store={store}>
        <div className="main-board">
          <div className="queue-div">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="project-task-div">
                <div className="row-ordered-div">
                  <DefaultButton
                    className="filter-button"
                    text="Filter"
                    iconProps={filterIcon}
                    menuProps={filterMenuProps}
                    menuAs={_getMenu}
                    allowDisabledFocus
                  />
                </div>
                <div className="queue-div">
                  <Droppable key={0} droppableId="0">
                    {(
                      provided: DroppableProvided,
                      snapshot: DroppableStateSnapshot
                    ) => (
                      <div
                        ref={provided.innerRef}
                        className="list"
                        style={getListStyle(snapshot.isDraggingOver)}
                        {...provided.droppableProps}>
                        <div className="list-header project-task-list">
                          <span>
                            Project Tasks
                            <br />
                          </span>
                        </div>
                        <div className="list-body">
                          {list[0].map((item, index) => (
                            <Draggable
                              key={item.id}
                              draggableId={item.id}
                              index={index}
                              isDragDisabled={item.isClosed}>
                              {(
                                provided: DraggableProvided,
                                snapshot: DraggableStateSnapshot
                              ) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={getItemStyle(
                                    snapshot.isDragging,
                                    provided.draggableProps.style
                                  )}>
                                  <TaskCard
                                    id={item.id}
                                    isProjectTask={true}
                                    projectTask={item.projectTask}
                                    sprintTask={item.sprintTask}
                                    dayIndex={0}
                                    list={list}
                                    setList={setList}
                                    isClosed={item.isClosed}
                                  />
                                  {/* <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-around'
                                }}>
                                {item.projectTask.name}
                               
                              </div> */}
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
              <div className="week-day-div">
                <div className="row-ordered-div">
                  <TextField
                    placeholder="filtering area"
                    className="search-field"
                  />
                </div>
                <div className="queue-div">
                  {list.slice(1).map((el, ind) => (
                    <Droppable key={ind + 1} droppableId={`${ind + 1}`}>
                      {(
                        provided: DroppableProvided,
                        snapshot: DroppableStateSnapshot
                      ) => (
                        <div
                          ref={provided.innerRef}
                          className="list"
                          style={getListStyle(snapshot.isDraggingOver)}
                          {...provided.droppableProps}>
                          <div className="list-header sprint-task-list">
                            <span>
                              {moment(props.weekdays[ind]).format('dddd')}
                              <br />
                              {moment(props.weekdays[ind]).format('MMM Do')}
                            </span>
                          </div>
                          <div className="list-body">
                            {el.map((item, index) => (
                              <Draggable
                                key={item.id}
                                draggableId={item.id}
                                index={index}
                                isDragDisabled={item.isClosed}>
                                {(
                                  provided: DraggableProvided,
                                  snapshot: DraggableStateSnapshot
                                ) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(
                                      snapshot.isDragging,
                                      provided.draggableProps.style
                                    )}>
                                    <TaskCard
                                      id={item.id}
                                      isProjectTask={false}
                                      projectTask={item.projectTask}
                                      sprintTask={item.sprintTask}
                                      dayIndex={ind + 1}
                                      list={list}
                                      setList={setList}
                                      isClosed={item.isClosed}
                                    />
                                    {/* <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-around'
                                }}>
                                {item.projectTask.name}
                               
                              </div> */}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </div>
            </DragDropContext>
          </div>
          {/* <div className="pt-column">
            {
            taskList.map((record,index) => {
                 return <div key={index} draggable onDragStart={(e) => dragStart(e, index)} 
                 onDragEnter={(e) => dragEnter(e, index)} onDragEnd={drop}>
                     <TaskCard  name={record.name}/></div>
                    })
            }
            
        </div>
        <div className="vertical-line"/>
        {dayArrays.map((item)=>(<div  className="column" key={item.getDate()}>
            <span>
                {item.getDate()}
            </span>
         
        </div>))} */}
        </div>
      </Provider>
    </ThemeProvider>
  )
}

export default KanbanView
