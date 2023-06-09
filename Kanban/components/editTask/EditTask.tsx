/* eslint-disable react-hooks/exhaustive-deps */
import {
  ComboBox,
  DefaultButton,
  IComboBox,
  IComboBoxOption,
  IconButton,
  IIconProps,
  MaskedTextField,
  PrimaryButton,
  registerIcons,
  Text
} from '@fluentui/react'

import React, { useEffect, useState } from 'react'
import { ChromeCloseIcon } from '@fluentui/react-icons-mdl2'
import './EditTask.css'
import { getAllOwners } from '../../redux/features/ownerSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { IColumnItem, IOwner } from '../../interfaces'
import { updateProjectTask, updateSprintTask } from '../../services/services'

interface IEditTaskProps {
  id: string
  editProjectTask: boolean
  hideModal: () => void
  owner: string
  duration: number
  dayIndex: number
  list: IColumnItem[][]
  setList: (value: IColumnItem[][]) => void
}

registerIcons({
  icons: {
    closeIcon: <ChromeCloseIcon />
  }
})
const closeIcon: IIconProps = { iconName: 'closeIcon' }
const maskFormat: { [key: string]: RegExp } = {
  '*': /[0-9]/
}
const EditTask: React.FC<IEditTaskProps> = ({
  id,
  editProjectTask,
  hideModal,
  owner,
  duration,
  dayIndex,
  list,
  setList
}) => {
  // const countries = useSelector((state) => state.geo.country.list) || []
  const owners = useAppSelector((state) => state.owner.list)
  // const board = useAppSelector((state) => state.board.list)
  console.log('owners', owners)
  const dispatch = useAppDispatch()
  const [options, setOptions] = useState<IComboBoxOption[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [durationVal, setDurationVal] = useState(duration)
  const [isCloased, setIsCloased] = useState(false)
  const statusOptions = [
    { key: 0, text: 'Yes' },
    { key: 1, text: 'No' }
  ]

  useEffect(() => {
    if (owners.length === 0) dispatch(getAllOwners())
  }, [])

  useEffect(() => {
    const optionList: IComboBoxOption[] = owners.map((item) => ({
      key: item.id,
      text: item.name
    }))
    setOptions(optionList)
    const selected = owners.find((x) => x.name === owner)
    setSelectedKey(selected ? selected.id : '')
  }, [owners])

  // const comboBoxRef = React.useRef<IComboBox>(null)
  // const onOpenClick = React.useCallback(
  //   () => comboBoxRef.current?.focus(true),
  //   []
  // )

  const saveChanges = () => {
    const updatedBoard = [...list]
    const cardIndex = updatedBoard[dayIndex].findIndex((x) => x.id === id)
    const selectedOwner = owners.find((x) => x.id === selectedKey)
    if (editProjectTask) {
      if (cardIndex > -1) {
        updatedBoard[0][cardIndex].projectTask.owner = selectedOwner
          ? selectedOwner.name
          : ''
        updatedBoard[0][cardIndex].projectTask.estimatedDuration =
          String(durationVal)
        updatedBoard[0][cardIndex].isClosed = isCloased
        setList(updatedBoard)
        updateProjectTask()
      }
    } else {
      updatedBoard[dayIndex][cardIndex].sprintTask!.owner = selectedOwner
        ? selectedOwner.name
        : ''
      updatedBoard[dayIndex][cardIndex].sprintTask!.estimatedDuration =
        String(durationVal)
      updatedBoard[dayIndex][cardIndex].isClosed = isCloased
      setList(updatedBoard)
      updateSprintTask()
    }
    hideModal()
  }
  return (
    <div className="edit-div">
      <div className="header">
        <Text variant="mediumPlus" nowrap block>
          {editProjectTask ? 'Edit Project Task' : 'Edit Sprint Task'}
        </Text>
        <IconButton
          iconProps={closeIcon}
          className="close-icon"
          onClick={hideModal}
        />
      </div>
      <div className="content">
        <div className="form-row">
          <div className="form-field">
            <Text variant="medium" block className="text-input-label">
              Owner:
            </Text>
          </div>
          <div className="form-field">
            {/* <TextField ariaLabel="owner" required /> */}
            <ComboBox
              // componentRef={comboBoxRef}
              selectedKey={selectedKey}
              // defaultSelectedKey="C"
              // label="Basic single-select ComboBox"
              options={options}
              className="text-input"
              onChange={(
                event: React.FormEvent<IComboBox>,
                option?: IComboBoxOption
              ) => {
                if (option) {
                  const key = String(option.key)
                  setSelectedKey(key)
                } else setSelectedKey('')
              }}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <Text variant="medium" block className="text-input-label">
              Estimated Duration:
            </Text>
          </div>
          <div className="form-field">
            <MaskedTextField
              className="text-input"
              maskFormat={maskFormat}
              mask="**.**"
              maskChar="0"
              value={String(durationVal)}
              onChange={(
                event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
                newValue?: string
              ) => {
                setDurationVal(Number(newValue))
              }}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <Text variant="medium" block className="text-input-label">
              Is Closed:
            </Text>
          </div>
          <div className="form-field">
            <ComboBox
              selectedKey={isCloased ? 0 : 1}
              defaultSelectedKey={0}
              options={statusOptions}
              className="text-input"
              onChange={(
                event: React.FormEvent<IComboBox>,
                option?: IComboBoxOption
              ) => {
                if (option) {
                  const key = option.key
                  setIsCloased(key === 0 ? true : false)
                } else setIsCloased(false)
              }}
            />
          </div>
        </div>
      </div>
      <div className="footer">
        <DefaultButton
          text="Cancel"
          onClick={hideModal}
          className="button default-button"
        />
        <PrimaryButton text="Save" className="button" onClick={saveChanges} />
      </div>
    </div>
  )
}

export default EditTask
