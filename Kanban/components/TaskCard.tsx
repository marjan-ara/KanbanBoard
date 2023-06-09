import * as React from 'react'
import { IColumnItem, IProjectTask, ISprintTask } from '../interfaces'
import './TaskCard.css'
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
  TooltipHost
} from '@fluentui/react'
import { useBoolean, useId } from '@fluentui/react-hooks'
import EditTask from './editTask/EditTask'
import {
  createSprintTask,
  deleteProjectTask,
  deleteSprintTask
} from '../services/services'

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
}

const TaskCard: React.FC<IProps> = ({
  id,
  isProjectTask,
  projectTask,
  sprintTask,
  dayIndex,
  isClosed,
  list,
  setList
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
    if (isProjectTask) deleteProjectTask(id)
    else deleteSprintTask(id)
  }

  const cloneToNextDay = () => {
    console.log('clone')
    const board = [...list]
    const sprintTask = board[dayIndex].find((x) => x.id === id)
    console.log('sprintTask', sprintTask)
    board[dayIndex + 1].push(sprintTask!)
    setList(board)
    createSprintTask()
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
        <div className="row-ordered-div">
          <b>{projectTask.name}</b>
        </div>
        <div className="row-ordered-div">
          <b>Project:</b>
          {`  ${projectTask.project}`}
        </div>
        <div className="row-ordered-div">
          <b>Feature: </b>
          {projectTask.feature}
        </div>
      </div>
      <div className="task-card-footer">
        <div className="task-card-footer-left">
          {projectTask.owner}
          <br />
          {projectTask.estimatedDuration}
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
        />
      </Modal>
    </div>
  )
}

export default TaskCard
