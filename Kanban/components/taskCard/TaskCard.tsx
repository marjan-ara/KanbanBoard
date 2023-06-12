/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-redeclare */
import * as React from 'react'
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
//   deleteSprintTask
// } from '../../services/services'
import {
  createSprintTask,
  deleteProjectTask,
  deleteSprintTask
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
  const tooltipId = useId('tooltip')
  const titleId = useId('title')
  const [isEditModalOpen, { setTrue: showEditModal, setFalse: hideEditModal }] =
    useBoolean(false)

  const deleteCard = () => {
    const board = [...list]
    const index = board[dayIndex].findIndex((x) => x.id === id)
    board[dayIndex].splice(index, 1)
    setList(board)
    if (isProjectTask) deleteProjectTask(context!, id)
    else deleteSprintTask(context!, id)
  }

  const cloneToNextDay = async () => {
    const board = [...list]
    const sprintTaskCard = board[dayIndex].find((x) => x.id === id)
    board[dayIndex + 1].push(sprintTaskCard!)
    setList(board)
    await createSprintTask(
      context!,
      sprintTaskCard!.projectTask.id,
      sprintTaskCard!.id,
      weekDays[dayIndex + 1],
      weekDays[dayIndex + 1]
    )
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
            {isProjectTask ? projectTask.project : sprintTask?.project}
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
        <div className="task-card-footer-left">
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
        </div>
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
          owner={projectTask.owner}
          duration={Number(projectTask.estimatedDuration)}
          dayIndex={dayIndex}
          list={list}
          setList={setList}
          context={context!}
        />
      </Modal>
    </div>
  )
}

export default TaskCard
