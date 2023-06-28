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
  Spinner,
  SpinnerSize,
  ThemeProvider
} from '@fluentui/react'
import {
  CaretLeftSolid8Icon,
  CaretRightSolid8Icon,
  FilterIcon
} from '@fluentui/react-icons-mdl2'
import moment, { weekdays } from 'moment'
import * as React from 'react'
import { v4 as uuidv4 } from 'uuid'
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
import { IColumnItem, IProject } from '../../interfaces'

// import {
//   createSprintTask,
//   deleteSprintTask,
//   getColumnCards,
//   getFeatures,
//   getOwners,
//   getProjects,
//   getProjectTasks,
//   getSprintFilters,
//   getSprintId,
//   getWeekDays
// } from '../../services/services'

import {
  createSprintTask,
  deleteSprintTask,
  getColumnCards,
  getFeatures,
  getOwners,
  getProjects,
  getProjectTasks,
  getSprintFilters,
  getSprintId,
  getWeekDays,
  openQuickCreateForm
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
const addIcon: IIconProps = { iconName: 'Add' }
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
  background: isDragging ? 'rgb(245, 245, 245)' : '',

  // styles we need to apply on draggables
  ...draggableStyle
})
const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? 'rgb(245, 245, 245)' : ''
})

const KanbanView: React.FC<IKanbanViewProps> = (props) => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState(props.taskList)
  const [weekDays, setWeekDays] = useState(props.weekdays)

  const createNewCard = async (
    cardId: string,
    boardColIndex: number,
    name: string,
    projectId: string,
    projectTaskId: string,
    startDate: Date,
    endDate: Date,
    board: IColumnItem[][],
    projectName: string
  ) => {
    try {
      const sprintId = await getSprintId(
        props.context!,
        projectId,
        startDate,
        projectName
      )
      const sprintTaskId = await createSprintTask(
        props.context!,
        name,
        projectId,
        projectTaskId,
        sprintId,
        startDate,
        endDate
      )

      const itemIdx = board[boardColIndex].findIndex((x) => x.id === cardId)

      if (itemIdx > -1) {
        board[boardColIndex][itemIdx].sprintTask!.id = sprintTaskId
        board[boardColIndex][itemIdx].sprintTask!.sprintId = sprintId
      }

      setList(board)
    } catch (error) {
      console.log(error)
    }
  }

  const move = async (
    droppableSource: DraggableLocation,
    droppableDestination: DraggableLocation,
    sIndex: number,
    dIndex: number
  ): Promise<void> => {
    const board = [...list]
    const sourceClone = Array.from(board[sIndex]) // Array.from(source)
    const destClone = Array.from(board[dIndex]) // Array.from(destination)
    const removed = sourceClone[droppableSource.index]
    // destClone.splice(droppableDestination.index, 0, removed)
    if (sIndex === 0 && dIndex > 0) {
      const pt = removed.projectTask

      if (
        pt.estimatedDuration === 'null' ||
        pt.plannedStartDate === 'null' ||
        pt.plannedEndDate === 'null' ||
        pt.owner === 'null'
      )
        alert(
          'Data of this project task not complete! must have Estimated Duration and Planned Start Date and Planned End Date and Owner'
        )
      else {
        removed.id = uuidv4()
        removed.isProjectTask = false
        removed.sprintTask = {
          id: null,
          name: removed.projectTask.name,
          project: removed.projectTask.project,
          feature: removed.projectTask.feature,
          estimatedDuration: removed.projectTask.estimatedDuration,
          priority: removed.projectTask.priority,
          owner: removed.projectTask.owner,
          sprintId: null
        }
        sourceClone.splice(droppableSource.index, 1)

        destClone.splice(droppableDestination.index, 0, removed)

        board[sIndex] = sourceClone
        board[dIndex] = destClone

        setList(board)
        const sprintTaskDate = weekDays[dIndex - 1]

        createNewCard(
          removed.id,
          dIndex,
          removed.sprintTask.name,
          removed.projectId,
          removed.projectTask.id,
          sprintTaskDate,
          sprintTaskDate,
          board,
          removed.projectTask.project
        )
      }
    } else if (sIndex > 0 && dIndex === 0) {
      sourceClone.splice(droppableSource.index, 1)
      board[sIndex] = sourceClone
      setList(board)
      deleteSprintTask(props.context!, removed.sprintTask!.id!)
    } else {
      deleteSprintTask(props.context!, removed.sprintTask!.id!)
      removed.id = uuidv4()
      removed.isProjectTask = false
      removed.sprintTask = {
        id: null,
        name: removed.sprintTask!.name,
        project: removed.sprintTask!.project,
        feature: removed.sprintTask!.feature,
        estimatedDuration: removed.sprintTask!.estimatedDuration,
        priority: removed.sprintTask!.priority,
        owner: removed.sprintTask!.owner,
        sprintId: removed.sprintTask!.sprintId
      }

      sourceClone.splice(droppableSource.index, 1)
      destClone.splice(droppableDestination.index, 0, removed)
      board[sIndex] = sourceClone
      board[dIndex] = destClone
      setList(board)
      const sprintTaskDate = weekDays[dIndex - 1]

      createNewCard(
        removed.id,
        dIndex,
        removed.sprintTask.name,
        removed.projectId,
        removed.projectTask.id,
        sprintTaskDate,
        sprintTaskDate,
        board,
        removed.projectTask.project
      )
    }
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

  const [projectOptionsPT, setProjectOptionsPT] = useState<IComboBoxOption[]>(
    []
  )
  const [featureOptionsPT, setFeatureOptionsPT] = useState<IComboBoxOption[]>(
    []
  )
  const [ownerOptionsPT, setOwnerOptionsPT] = useState<IComboBoxOption[]>([])

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

  const asyncFilterProjectTasks = async () => {
    // setOpenFilterMenu(false)
    const btn = document.getElementById('filterProjectTasksBtn')
    btn?.click()
    const board = [...list]
    const filteredProjTasks = await getProjectTasks(
      props.context!,
      selectedProjectIds,
      selectedOwnerIds,
      selectedFeatureIds
    )
    board[0] = filteredProjTasks
    setList(board)
  }

  const renderMenuList = () => {
    return (
      <div>
        <div className="menu-div">
          <ComboBox
            label="Filter Projects"
            multiSelect
            selectedKey={selectedProjectIds}
            options={projectOptionsPT}
            onChange={onChangeProjectFilter}
          />
          <ComboBox
            label="Filter Features"
            multiSelect
            selectedKey={selectedFeatureIds}
            options={featureOptionsPT}
            onChange={onChangeFeatureFilter}
          />
          <ComboBox
            label="Filter Owners"
            multiSelect
            selectedKey={selectedOwnerIds}
            options={ownerOptionsPT}
            onChange={onChangeOwnerFilter}
          />

          <PrimaryButton
            className="search-button"
            text="Search"
            onClick={asyncFilterProjectTasks}
          />
        </div>

        {/* {defaultRender(menuListProps)} */}
      </div>
    )
  }

  const [projectOptionsST, setProjectOptionsST] = useState<IComboBoxOption[]>(
    []
  )

  const [featureOptionsST, setFeatureOptionsST] = useState<IComboBoxOption[]>(
    []
  )

  const [ownerOptionsST, setOwnerOptionsST] = useState<IComboBoxOption[]>([])

  const setSTFeatureOpionsBasedOnProjectIds = async () => {
    const filterOptions = await getSprintFilters(props.context!)
    let features = filterOptions.features
    if (sprintFilterSelectedProjectIds.length > 0) {
      features = features.filter((item) =>
        sprintFilterSelectedProjectIds.includes(item.projectId)
      )
    }

    const fo = features.map((item) => ({
      key: item.id,
      text: item.name
    }))
    setFeatureOptionsST(fo)
  }

  useEffect(() => {
    setSTFeatureOpionsBasedOnProjectIds()
  }, [sprintFilterSelectedProjectIds])

  const getSprintFilterOptions = async () => {
    const filterOptions = await getSprintFilters(props.context!)
    const po = filterOptions.projects.map((p) => ({
      key: p.id,
      text: p.name
    }))
    setProjectOptionsST(po)

    let featutes = filterOptions.features
    if (sprintFilterSelectedProjectIds.length > 0) {
      featutes = featutes.filter((x) =>
        sprintFilterSelectedProjectIds.includes(x.projectId)
      )
    }
    const fo = featutes.map((f) => ({
      key: f.id,
      text: f.name
    }))

    setFeatureOptionsST(fo)

    const oo = filterOptions.owners.map((o) => ({
      key: o.id,
      text: o.name
    }))
    setOwnerOptionsST(oo)
  }
  const initializeBoard = async () => {
    try {
      setLoading(true)
      const taskListVar = [...list]

      let i = 0
      while (i < 7) {
        const res = await getColumnCards(
          props.context!,
          weekDays[i],
          sprintFilterSelectedProjectIds,
          sprintFilterSelectedOwnerIds,
          sprintFilterSelectedFeatureIds
        )

        taskListVar[1 + i] = [...res]
        i++
      }
      setList(taskListVar)
      await getSprintFilterOptions()
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  const filterSprintTasks = () => {
    document.getElementById('filterSprintTasksBtn')?.click()
    initializeBoard()
  }

  const renderSprintTaskMenuList = () => {
    return (
      <div>
        <div className="menu-div">
          <ComboBox
            label="Filter Projects"
            multiSelect
            selectedKey={sprintFilterSelectedProjectIds}
            options={projectOptionsST}
            onChange={onChangeSprintTasksProjectFilter}
          />
          <ComboBox
            label="Filter Features"
            multiSelect
            selectedKey={sprintFilterSelectedFeatureIds}
            options={featureOptionsST}
            onChange={onChangeSprintTaskFeatureFilter}
          />
          <ComboBox
            label="Filter Owners"
            multiSelect
            selectedKey={sprintFilterSelectedOwnerIds}
            options={ownerOptionsST}
            onChange={onChangeSprintTasksOwnerFilter}
          />

          <PrimaryButton
            className="search-button"
            text="Search"
            onClick={filterSprintTasks}
          />
        </div>
        {/* {defaultRender(menuListProps)} */}
      </div>
    )
  }
  const filterMenuProps = {
    onRenderMenuList: renderMenuList,
    shouldFocusOnMount: false,

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

  const setFeatureOpionsBasedOnProjectIds = async (projectIds: string[]) => {
    let features = await getFeatures(props.context!)
    features = features.filter((x) => projectIds.includes(x.projectId))
    const fo = features.map((f) => ({
      key: f.id,
      text: f.name
    }))
    setFeatureOptionsPT(fo)
  }

  useEffect(() => {
    if (selectedProjectIds.length > 0)
      setFeatureOpionsBasedOnProjectIds(selectedProjectIds)
    else {
      const projectIds = list[0].map((item) => item.projectId)
      setFeatureOpionsBasedOnProjectIds(projectIds)
    }
  }, [selectedProjectIds])

  const getProjectTaskFilterOptions = async () => {
    try {
      const projectIds = list[0].map((item) => item.projectId)
      let projects = await getProjects(props.context!)
      projects = projects.filter((x) => projectIds.includes(x.id))
      const po = projects.map((p) => ({
        key: p.id,
        text: p.name
      }))
      setProjectOptionsPT(po)

      let ownerNames = list[0].map((item) => item.projectTask.owner)
      let owners = await getOwners(props.context!)
      owners = owners.filter((x) => ownerNames.includes(x.name))
      const oo = owners.map((o) => ({
        key: o.id,
        text: o.name
      }))
      setOwnerOptionsPT(oo)

      setFeatureOpionsBasedOnProjectIds(projectIds)
    } catch (error) {
      console.log(error)
    }
  }

  const [isFirstLoad, setIsFirstLoad] = useState(true)
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false)
      initializeBoard()
      getProjectTaskFilterOptions()
    }
  }, [isFirstLoad])

  useEffect(() => {
    if (list !== props.taskList) {
      props.onChange(list, weekDays)
    }
  }, [list])

  useEffect(() => {
    if (weekDays !== props.weekdays) {
      initializeBoard()
    }
  }, [weekDays])

  useEffect(() => {
    if (list !== props.taskList) {
      setList(props.taskList)
      initializeBoard()
      getProjectTaskFilterOptions()
    }
    if (weekDays !== props.weekdays) {
      setWeekDays(props.weekdays)
    }
  }, [props.taskList, props.weekdays])

  const onDragEnd = async (result: DropResult): Promise<void> => {
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
      move(source, destination, sInd, dInd)
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
    // <ThemeProvider>

    <div className="main-board">
      <div className="queue-div">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="project-task-div">
            <div className="row-ordered-div">
              <DefaultButton
                id="filterProjectTasksBtn"
                className="filter-button"
                text="Filter"
                iconProps={filterIcon}
                menuProps={filterMenuProps}
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
                      <IconButton
                        iconProps={addIcon}
                        className="add-icon"
                        onClick={openQuickCreateForm}
                        title="new projectTask"
                        ariaLabel="new projectTask"
                      />
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
              <div className="change-week-button-div" />
              <div className="row-ordered-div">
                <DefaultButton
                  id="filterSprintTasksBtn"
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
              {loading ? (
                <div className="spinner-div">
                  <Spinner size={SpinnerSize.large} />
                </div>
              ) : (
                <>
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
                </>
              )}
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

    // </ThemeProvider>
  )
}

export default KanbanView
