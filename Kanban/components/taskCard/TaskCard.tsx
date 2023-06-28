/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-redeclare */
import * as React from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  ChromeBackMirroredIcon,
  EditMirroredIcon,
  DeleteIcon
} from '@fluentui/react-icons-mdl2'
import {
  IconButton,
  IIconProps,
  ITooltipHostStyles,
  Modal,
  registerIcons,
  Text,
  TooltipHost
} from '@fluentui/react'
import { useBoolean, useId } from '@fluentui/react-hooks'
import { IColumnItem, IProjectTask, ISprintTask } from '../../interfaces'
import EditTask from '../editTask/EditTask'
import './TaskCard.css'
// import {
//   createSprintTask,
//   deleteProjectTask,
//   deleteSprintTask,
//   openProjectTask,
//   openSprintTask
// } from '../../services/services'
import {
  createSprintTask,
  deleteProjectTask,
  deleteSprintTask,
  openProjectTask,
  openSprintTask
} from '../../services/xrmServices'

import { IInputs } from '../../generated/ManifestTypes'

registerIcons({
  icons: {
    cloneIcon: <ChromeBackMirroredIcon />,
    editIcon: <EditMirroredIcon />,
    deleteIcon: <DeleteIcon />
  }
})
const calloutProps = { gapSpace: 0 }
const hostStyles: Partial<ITooltipHostStyles> = {
  root: { display: 'inline-block' }
}
const cloneIcon: IIconProps = { iconName: 'cloneIcon' }
const editIcon: IIconProps = { iconName: 'editIcon' }
const deleteIcon: IIconProps = { iconName: 'deleteIcon' }
interface IProps {
  id: string
  isProjectTask: boolean
  projectTask: IProjectTask
  sprintTask: ISprintTask | null
  dayIndex: number
  list: IColumnItem[][]
  setList: (value: IColumnItem[][]) => void
  isClosed: boolean
  weekDays: Date[]
  context: ComponentFramework.Context<IInputs> | null
}

const TaskCard: React.FC<IProps> = ({
  id,
  isProjectTask,
  projectTask,
  sprintTask,
  dayIndex,
  isClosed,
  list,
  setList,
  weekDays,
  context
}) => {
  let projTaskStartDate = new Date()
  let projTaskEndDate = new Date()
  if (
    projectTask.plannedStartDate &&
    projectTask.plannedStartDate !== 'undefined' &&
    projectTask.plannedStartDate !== 'null'
  )
    projTaskStartDate = new Date(projectTask.plannedStartDate)

  if (
    projectTask.plannedEndDate &&
    projectTask.plannedEndDate !== 'undefined' &&
    projectTask.plannedEndDate !== 'null'
  )
    projTaskEndDate = new Date(projectTask.plannedEndDate)
  const tooltipId = useId('tooltip')
  const titleId = useId('title')
  const [isEditModalOpen, { setTrue: showEditModal, setFalse: hideEditModal }] =
    useBoolean(false)

  // const [disableActions, setDisableActions] = React.useState(false)
  const deleteCard = () => {
    const board = [...list]
    const index = board[dayIndex].findIndex((x) => x.id === id)
    board[dayIndex].splice(index, 1)
    setList(board)
    if (isProjectTask) deleteProjectTask(context!, projectTask.id)
    else deleteSprintTask(context!, sprintTask!.id!)
  }

  const createNewCard = async (
    cardId: string,
    boardColIndex: number,
    name: string,
    projectId: string,
    projectTaskId: string,
    sprintId: string,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      const sprintTaskId = await createSprintTask(
        context!,
        name,
        projectId,
        projectTaskId,
        sprintId,
        startDate,
        endDate
      )

      const board = [...list]
      const itemIdx = board[boardColIndex].findIndex((x) => x.id === cardId)

      if (itemIdx > -1) {
        board[boardColIndex][itemIdx].sprintTask!.id = sprintTaskId
      }

      setList(board)
    } catch (error) {
      console.log(error)
    }
  }
  const cloneToNextDay = () => {
    const board = [...list]
    let sprintTaskCard = board[dayIndex].find((x) => x.id === id)
    if (sprintTaskCard) {
      const newCard: IColumnItem = {
        id: uuidv4(),
        projectId: sprintTaskCard.projectId,
        isClosed: false,
        isProjectTask: false,
        projectTask: {
          id: sprintTaskCard.projectTask.id,
          name: sprintTaskCard.projectTask.name,
          project: sprintTaskCard.projectTask.project,
          priority: sprintTaskCard.projectTask.priority,
          estimatedDuration: sprintTaskCard.projectTask.estimatedDuration,
          feature: sprintTaskCard.projectTask.feature,
          owner: sprintTaskCard.projectTask.owner,
          plannedStartDate: sprintTaskCard.projectTask.plannedStartDate,
          plannedEndDate: sprintTaskCard.projectTask.plannedEndDate
        },
        sprintTask: {
          id: null,
          estimatedDuration: sprintTaskCard.sprintTask?.estimatedDuration!,
          feature: sprintTaskCard.sprintTask?.feature!,
          name: sprintTaskCard.sprintTask?.name!,
          owner: sprintTaskCard.sprintTask?.owner!,
          priority: sprintTaskCard.sprintTask?.priority!,
          project: sprintTaskCard.sprintTask?.project!,
          sprintId: sprintTaskCard.sprintTask?.sprintId!
        }
      }
      board[dayIndex + 1].push(newCard)
      setList(board)
      createNewCard(
        newCard.id,
        dayIndex + 1,
        newCard.projectTask.name,
        newCard.projectId,
        newCard.projectTask.id,
        newCard.sprintTask!.sprintId!,
        weekDays[dayIndex],
        weekDays[dayIndex]
      )
    }
  }

  const openProjectTaskForm = () => {
    openProjectTask(projectTask.id)
  }

  const openSprintTaskForm = () => {
    if (sprintTask && sprintTask.id) openSprintTask(sprintTask.id)
  }

  return (
    <div className="task-card-div">
      <div className="task-card-header">
        {!isProjectTask && (
          <TooltipHost
            content="Clone to the next day"
            id={tooltipId}
            calloutProps={calloutProps}
            styles={hostStyles}
            setAriaDescribedBy={false}>
            <IconButton
              iconProps={cloneIcon}
              onClick={cloneToNextDay}
              disabled={isClosed}
            />
          </TooltipHost>
        )}
        <TooltipHost
          content="Edit"
          id={tooltipId}
          calloutProps={calloutProps}
          styles={hostStyles}
          setAriaDescribedBy={false}>
          <IconButton
            iconProps={editIcon}
            onClick={showEditModal}
            disabled={isClosed}
          />
        </TooltipHost>
        <TooltipHost
          content="Delete"
          id={tooltipId}
          calloutProps={calloutProps}
          styles={hostStyles}
          setAriaDescribedBy={false}>
          <IconButton
            iconProps={deleteIcon}
            onClick={deleteCard}
            disabled={isClosed}
          />
        </TooltipHost>

        {/* <ChromeBackMirroredIcon className="task-card-icon" />
        <EditMirroredIcon className="task-card-icon" />
        <DeleteIcon className="task-card-icon" /> */}
      </div>
      <div className="task-card-body">
        <div className="task-card-row-ordered-div">
          <b>{isProjectTask ? projectTask.name : sprintTask?.name}</b>
        </div>
        <div className="task-card-row-ordered-div">
          <Text variant="small" nowrap={false} block>
            <b>Project:</b>
            {isProjectTask
              ? `  ${projectTask.project}`
              : `  ${sprintTask?.project}`}
          </Text>
        </div>
        <div className="task-card-row-ordered-div">
          <Text variant="small" nowrap={false} block>
            <b>Feature: </b>
            {isProjectTask ? projectTask.feature : sprintTask?.feature}
          </Text>
        </div>
      </div>
      <div className="task-card-footer">
        <div className="task-card-row-ordered-div">
          <Text variant="small" nowrap={false} block>
            <b>Owner: </b>
            {isProjectTask ? projectTask.owner : sprintTask?.owner}
          </Text>
        </div>
        <div className="task-card-row-ordered-div">
          <Text
            variant="small"
            nowrap={false}
            block
            style={{ textAlign: 'left' }}>
            <b>Estimated duration: </b>
            {isProjectTask
              ? projectTask.estimatedDuration
              : sprintTask?.estimatedDuration}
          </Text>
        </div>
        <div className="task-card-row-ordered-div">
          <Text variant="small" nowrap={false} block>
            <b>priority: </b>
            {projectTask.priority || ''}
          </Text>
        </div>
        {!isProjectTask && (
          <div className="task-card-row-ordered-div">
            <Text
              variant="small"
              nowrap={false}
              block
              onClick={() => {
                openSprintTaskForm()
              }}
              style={{ marginTop: '1em' }}
              className="action-button">
              Open Sprint Task
            </Text>
            {/* <ActionButton
              onClick={() => {
                openSprintTaskForm()
              }}>
              Open Sprint Task Form
            </ActionButton> */}
          </div>
        )}
        <div className="task-card-row-ordered-div">
          {/* <ActionButton
            onClick={() => {
              openProjectTaskForm()
            }}>
            Open Project Task Form
          </ActionButton> */}
          <Text
            variant="small"
            nowrap={false}
            block
            onClick={() => {
              openProjectTaskForm()
            }}
            className="action-button">
            Open Project Task
          </Text>
        </div>

        {/* <div className="task-card-footer-left">
          {isProjectTask ? projectTask.owner : sprintTask?.owner}
          <br />
          {isProjectTask
            ? projectTask.estimatedDuration
            : sprintTask?.estimatedDuration}
          <br />
          {projectTask.priority || 'not defined'}
          <br />
        </div>
        <div className="task-card-footer-right">
          Owner
          <br />
          Estimated duration
          <br />
          priority
          <br />
        </div> */}
      </div>

      <Modal
        titleAriaId={titleId}
        isOpen={isEditModalOpen}
        onDismiss={hideEditModal}
        isBlocking={true}
        containerClassName="edit-modal-container">
        <EditTask
          id={id}
          editProjectTask={isProjectTask}
          hideModal={hideEditModal}
          owner={isProjectTask ? projectTask.owner : sprintTask!.owner}
          duration={
            isProjectTask
              ? Number(projectTask.estimatedDuration)
              : Number(sprintTask?.estimatedDuration)
          }
          dayIndex={dayIndex}
          list={list}
          setList={setList}
          context={context!}
          startDate={projTaskStartDate}
          endDate={projTaskEndDate}
        />
      </Modal>
    </div>
  )
}

export default TaskCard
