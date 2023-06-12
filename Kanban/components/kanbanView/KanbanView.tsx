/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import {
  ComboBox,
  DefaultButton,
  IComboBox,
  IComboBoxOption,
  IconButton,
  IIconProps,
  PrimaryButton,
  registerIcons,
  ThemeProvider
} from '@fluentui/react'
import {
  CaretLeftSolid8Icon,
  CaretRightSolid8Icon,
  FilterIcon
} from '@fluentui/react-icons-mdl2'
import moment, { weekdays } from 'moment'
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
import { IInputs } from '../../generated/ManifestTypes'
import { IColumnItem } from '../../interfaces'
import store from '../../redux/store'
// import {
//   createSprintTask,
//   deleteSprintTask,
//   getColumnCards,
//   getFeatures,
//   getOwners,
//   getProjects,
//   getWeekDays
// } from '../../services/services'
import {
  createSprintTask,
  deleteSprintTask,
  getColumnCards,
  getFeatures,
  getOwners,
  getProjects,
  getWeekDays
} from '../../services/xrmServices'
import TaskCard from '../taskCard/TaskCard'
import './KanbanView.css'

registerIcons({
  icons: {
    filterIcon: <FilterIcon />,
    nextWeekIcon: <CaretRightSolid8Icon />,
    prevWeekIcon: <CaretLeftSolid8Icon />
  }
})
const filterIcon: IIconProps = { iconName: 'filterIcon' }
const nextWeekIcon: IIconProps = { iconName: 'nextWeekIcon' }
const prevWeekIcon: IIconProps = { iconName: 'prevWeekIcon' }
export interface IKanbanViewProps {
  // appContext: ComponentFramework.Context<IInputs>;
  taskList: IColumnItem[][]
  weekdays: Date[]
  onChange: (taskList: IColumnItem[][], newWeekDays: Date[]) => void
  context: ComponentFramework.Context<IInputs> | null
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
  const [weekDays, setWeekDays] = useState(props.weekdays)

  const move = async (
    source: IColumnItem[],
    destination: IColumnItem[],
    droppableSource: DraggableLocation,
    droppableDestination: DraggableLocation,
    sIndex: number,
    dIndex: number
  ): Promise<IMoveResult> => {
    const sourceClone = Array.from(source)
    const destClone = Array.from(destination)

    const removed = sourceClone[droppableSource.index]
    // destClone.splice(droppableDestination.index, 0, removed)

    if (sIndex === 0 && dIndex > 0) {
      const res = await createSprintTask(
        props.context!,
        removed.projectTask.id,
        removed.projectTask.id,
        weekDays[0],
        weekDays[6]
      )
      const stId = res
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
      deleteSprintTask(props.context!, removed.id)
    } else {
      deleteSprintTask(props.context!, removed.id)
      const stId = await createSprintTask(
        props.context!,
        removed.projectTask.id,
        removed.projectTask.id,
        weekDays[0],
        weekDays[6]
      )
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
    // const result: IMoveResult | any = {}
    // result[droppableSource.droppableId] = sourceClone
    // result[droppableDestination.droppableId] = destClone

    const result: IMoveResult = {
      droppable: sourceClone,
      droppable2: destClone
    }

    return result
  }


  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [sprintFilterSelectedProjectIds, setSprintFilterSelectedProjectIds] =
    useState<string[]>([])

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

  const onChangeSprintTasksProjectFilter = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected
    if (option) {
      setSprintFilterSelectedProjectIds((prevSelectedKeys) =>
        selected
          ? [...prevSelectedKeys, option!.key as string]
          : prevSelectedKeys.filter((k) => k !== option!.key)
      )
    }
  }

  const owners = getOwners()
  const ownerOptions = owners.map((o) => ({
    key: o.id,
    text: o.name
  }))

  const [selectedOwnerIds, setSelectedOwnerIds] = React.useState<string[]>([])
  const [sprintFilterSelectedOwnerIds, setSprintFilterSelectedOwnerIds] =
    useState<string[]>([])
  const onChangeOwnerFilter = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected
    if (option) {
      setSelectedOwnerIds((prevSelectedKeys) =>
        selected
          ? [...prevSelectedKeys, option!.key as string]
          : prevSelectedKeys.filter((k) => k !== option!.key)
      )
    }
  }

  const onChangeSprintTasksOwnerFilter = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected
    if (option) {
      setSprintFilterSelectedOwnerIds((prevSelectedKeys) =>
        selected
          ? [...prevSelectedKeys, option!.key as string]
          : prevSelectedKeys.filter((k) => k !== option!.key)
      )
    }
  }

  const features = getFeatures()
  const featureOptions = features.map((f) => ({
    key: f.id,
    text: f.name
  }))

  const [selectedFeatureIds, setSelectedFeatureIds] = React.useState<string[]>(
    []
  )

  const [sprintFilterSelectedFeatureIds, setsprintFilterSelectedFeatureIds] =
    useState<string[]>([])
  const onChangeFeatureFilter = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected
    if (option) {
      setSelectedFeatureIds((prevSelectedKeys) =>
        selected
          ? [...prevSelectedKeys, option!.key as string]
          : prevSelectedKeys.filter((k) => k !== option!.key)
      )
    }
  }

  const onChangeSprintTaskFeatureFilter = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected
    if (option) {
      setsprintFilterSelectedFeatureIds((prevSelectedKeys) =>
        selected
          ? [...prevSelectedKeys, option!.key as string]
          : prevSelectedKeys.filter((k) => k !== option!.key)
      )
    }
  }

  const filterProjectTasks = () => {
    const board = [...list]
    // console.log('initial board[0]', board[0])
    // searchProjectTask()
    // if (selectedProjectIds.length > 0) {
    //   board[0] = board[0].filter((x) => selectedProjectIds.includes(x.id))
    //   console.log('board[0]', board[0])
    // } else {
    //   const allProjectIds = projects.map((x) => x.id)
    //   board[0] = board[0].filter((x) => allProjectIds.includes(x.id))
    //   console.log('board[0]', board[0])
    // }
    // if (selectedOwnerIds.length > 0) {
    //   const selectedOwnersNames = owners
    //     .filter((x) => selectedOwnerIds.includes(x.id))
    //     .map((item) => item.name)
    //   board[0] = board[0].filter((x) =>
    //     selectedOwnersNames.includes(x.projectTask.owner)
    //   )
    // }
    // setList(board)
  }

  const filterSprintTasks = () => {
    const board = [...list]
    // searchSprintTask()
    // if (selectedProjectIds.length > 0) {
    //   board[0] = board[0].filter((x) => selectedProjectIds.includes(x.id))
    //   console.log('board[0]', board[0])
    // } else {
    //   const allProjectIds = projects.map((x) => x.id)
    //   board[0] = board[0].filter((x) => allProjectIds.includes(x.id))
    //   console.log('board[0]', board[0])
    // }
    // if (selectedOwnerIds.length > 0) {
    //   const selectedOwnersNames = owners
    //     .filter((x) => selectedOwnerIds.includes(x.id))
    //     .map((item) => item.name)
    //   board[0] = board[0].filter((x) =>
    //     selectedOwnersNames.includes(x.projectTask.owner)
    //   )
    // }
    // setList(board)
  }

  const renderMenuList = () => {
    return (
      <div>
        <div className="menu-div">
          <ComboBox
            label="Filter Projects"
            multiSelect
            selectedKey={selectedProjectIds}
            options={projectOptions}
            onChange={onChangeProjectFilter}
          />
          <ComboBox
            label="Filter Owners"
            multiSelect
            selectedKey={selectedOwnerIds}
            options={ownerOptions}
            onChange={onChangeOwnerFilter}
          />
          <ComboBox
            label="Filter Features"
            multiSelect
            selectedKey={selectedFeatureIds}
            options={featureOptions}
            onChange={onChangeFeatureFilter}
          />
          <PrimaryButton
            className="search-button"
            text="Search"
            onClick={filterProjectTasks}
          />
        </div>
        {/* {defaultRender(menuListProps)} */}
      </div>
    )
  }

  const renderSprintTaskMenuList = () => {
    return (
      <div>
        <div className="menu-div">
          <ComboBox
            label="Filter Projects"
            multiSelect
            selectedKey={sprintFilterSelectedProjectIds}
            options={projectOptions}
            onChange={onChangeSprintTasksProjectFilter}
          />
          <ComboBox
            label="Filter Owners"
            multiSelect
            selectedKey={sprintFilterSelectedOwnerIds}
            options={ownerOptions}
            onChange={onChangeSprintTasksOwnerFilter}
          />
          <ComboBox
            label="Filter Features"
            multiSelect
            selectedKey={sprintFilterSelectedFeatureIds}
            options={featureOptions}
            onChange={onChangeSprintTaskFeatureFilter}
          />
          <PrimaryButton
            className="search-button"
            text="Search"
            onClick={filterProjectTasks}
          />
        </div>
        {/* {defaultRender(menuListProps)} */}
      </div>
    )
  }
  const filterMenuProps = {
    onRenderMenuList: renderMenuList,
    shouldFocusOnMount: true,
    items: [
      {
        key: 'project',
        text: 'Project'
      },
      {
        key: 'owner',
        text: 'Owner'
      },
      {
        key: 'feature',
        text: 'Feature'
      }
    ]
  }

  const filterSprintTaskMenuProps = {
    onRenderMenuList: renderSprintTaskMenuList,
    shouldFocusOnMount: true,
    items: [
      {
        key: 'project',
        text: 'Project'
      },
      {
        key: 'owner',
        text: 'Owner'
      },
      {
        key: 'feature',
        text: 'Feature'
      }
    ]
  }

  const getSprintTasksOfTheBoard = async () => {
    try {
      const promises: Promise<any>[] = []
      const taskListVar = [...list]
      weekDays.forEach((element, index) => {
        const projecttasks = taskListVar[0].map((item) => item.projectTask)
        promises.push(
          getColumnCards(props.context!, element, projecttasks).then((res) => {
            console.log('getColumnCards res', res)

            taskListVar[1 + index] = res
            console.log('taskListVar', taskListVar)
          })
        )
      })

      Promise.allSettled(promises).then(() => {
        setList(taskListVar)
      })
    } catch (error) {
      console.log(error)
    }
  }

  const getFilterOptions=async()=>{
    try{
      const projects = await getProjects(props.context!)
      const projectOptions = projects.map((p) => ({
        key: p.id,
        text: p.name
      }))
    }
    catch(error){
      console.log(error)
    }
  }
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false)
      getSprintTasksOfTheBoard()
    
    }
  }, [isFirstLoad])

  useEffect(() => {
    // console.log('change list, weekDays', list, weekDays)
    if (list !== props.taskList) {
      // console.log('change list 1:', list)
      props.onChange(list, weekDays)
    }
  }, [list])

  useEffect(() => {
    // console.log('change list, weekDays', list, weekDays)

    if (weekDays !== props.weekdays) {
      // console.log('change list 2:', list)
      getSprintTasksOfTheBoard()
    }
  }, [weekDays])

  useEffect(() => {
    if (list !== props.taskList) {
      // console.log('1')
      setList(props.taskList)
    }
    if (weekDays !== props.weekdays) {
      // console.log('2')
      setWeekDays(props.weekdays)
    }
  }, [props.taskList, props.weekdays])

  const onDragEnd=async (result: DropResult): Promise<void> {
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
      const res = await move(list[sInd], list[dInd], source, destination, sInd, dInd)
      const newState = [...list]
      newState[sInd] = res.droppable
      newState[dInd] = res.droppable2
      setList(newState)
    }
  }

  const getNextWeek = () => {
    const date = weekDays[6]
    date.setDate(date.getDate() + 1)

    const nextWeek = getWeekDays(date)
    setWeekDays(nextWeek)
  }

  const getPrevWeek = () => {
    const date = weekDays[0]
    date.setDate(date.getDate() - 2)
    const prevWeek = getWeekDays(date)
    setWeekDays(prevWeek)
  }
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
                    // menuAs={_getMenu}
                    // allowDisabledFocus
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
                                    weekDays={weekDays}
                                    context={props.context}
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
                  {/* <TextField
                    placeholder="filtering area"
                    className="search-field"
                  /> */}
                  <div className="row-ordered-div">
                    <DefaultButton
                      className="filter-button"
                      text="Filter"
                      iconProps={filterIcon}
                      menuProps={filterSprintTaskMenuProps}

                      // menuAs={_getMenu}
                      // allowDisabledFocus
                    />
                  </div>
                  <div className="row-ordered-div" />
                  <div className="row-ordered-div" />
                  <div className="row-ordered-div" />
                  <div className="row-ordered-div" />
                  <div className="row-ordered-div" />
                  <div className="row-ordered-div" />
                </div>
                <div className="queue-div">
                  <div className="change-week-button-div">
                    <IconButton
                      className="next-week-button"
                      iconProps={prevWeekIcon}
                      onClick={getPrevWeek}
                      title="Next Week"
                      ariaLabel="next week"
                    />
                  </div>
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
                              {moment(weekDays[ind]).format('dddd')}
                              <br />
                              {moment(weekDays[ind]).format('MMM Do')}
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
                                      weekDays={weekDays}
                                      context={props.context}
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
                  <div className="change-week-button-div">
                    <IconButton
                      className="next-week-button"
                      iconProps={nextWeekIcon}
                      onClick={getNextWeek}
                      title="Next Week"
                      ariaLabel="next week"
                    />
                  </div>
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
