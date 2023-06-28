/* eslint-disable @typescript-eslint/no-redeclare */
import {
  ComboBox,
  CommandBarButton,
  DatePicker,
  DayOfWeek,
  defaultDatePickerStrings,
  // DefaultButton,
  IComboBox,
  IComboBoxOption,
  IconButton,
  IIconProps,
  MaskedTextField,
  // PrimaryButton,
  registerIcons,
  Text
} from '@fluentui/react'

import React, { useEffect, useState } from 'react'
import {
  CancelIcon,
  ChromeCloseIcon,
  SaveIcon
} from '@fluentui/react-icons-mdl2'
import './EditTask.css'
// import { getAllOwners } from '../../redux/features/ownerSlice'
// import { useAppDispatch, useAppSelector } from '../../hooks'
import { IColumnItem, IOwner } from '../../interfaces'
// import {
//   getOwners,
//   getResourcesOfProject,
//   updateProjectTask,
//   updateSprintTask
// } from '../../services/services'
import {
  getResourcesOfProject,
  updateProjectTask,
  updateSprintTask
} from '../../services/xrmservices'
import { IInputs } from '../../generated/ManifestTypes'

interface IEditTaskProps {
  id: string
  editProjectTask: boolean
  hideModal: () => void
  owner: string
  duration: number
  dayIndex: number
  startDate: Date
  endDate: Date
  list: IColumnItem[][]
  setList: (value: IColumnItem[][]) => void
  context: ComponentFramework.Context<IInputs>
}

registerIcons({
  icons: {
    closeIcon: <ChromeCloseIcon />,
    saveIcon: <SaveIcon />,
    cancelIcon: <CancelIcon />
  }
})
const closeIcon: IIconProps = { iconName: 'closeIcon' }
const saveIcon: IIconProps = { iconName: 'saveIcon' }
const cancelIcon: IIconProps = { iconName: 'cancelIcon' }
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
  setList,
  context,
  startDate,
  endDate
}) => {
  const [owners, setOwners] = useState<IOwner[]>([])
  const [options, setOptions] = useState<IComboBoxOption[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [durationVal, setDurationVal] = useState(duration)
  const [isCloased, setIsCloased] = useState(false)
  const [plannedStartDate, setPlannedStartDate] = useState<Date>(new Date())
  const [plannedEndDate, setPlannedEndDate] = useState(new Date())
  const statusOptions = [
    { key: 0, text: 'Yes' },
    { key: 1, text: 'No' }
  ]

  const getOwnersAsync = async () => {
    const card = list[dayIndex].find((x) => x.id === id)

    const res = await getResourcesOfProject(context, card!.projectId)
    setOwners(res)
  }

  const onFormatDate = (date?: Date): string => {
    return !date
      ? ''
      : date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
  }

  useEffect(() => {
    getOwnersAsync()
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

  useEffect(() => {
    if (!startDate) setPlannedStartDate(new Date())
    else if (plannedStartDate !== startDate) setPlannedStartDate(startDate)

    if (!endDate) setPlannedEndDate(new Date())
    else if (plannedEndDate !== endDate) setPlannedEndDate(endDate)
  }, [startDate, endDate])

  useEffect(() => {
    setPlannedEndDate(plannedStartDate)
  }, [plannedStartDate])

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
        updatedBoard[0][cardIndex].projectTask.plannedStartDate =
          String(plannedStartDate)
        updatedBoard[0][cardIndex].projectTask.plannedEndDate =
          String(plannedEndDate)

        setList(updatedBoard)
        const toBeUpdated = updatedBoard[0][cardIndex]
        // context: ComponentFramework.Context<IInputs>,
        // projectTaskId: string,
        // ownerId: string,
        // estimatedDuration: number,
        // closeTask: boolean
        updateProjectTask(
          context,
          toBeUpdated.projectTask.id,
          selectedOwner?.id,
          durationVal,
          isCloased,
          plannedStartDate,
          plannedEndDate
        )
      }
    } else {
      updatedBoard[dayIndex][cardIndex].sprintTask!.owner = selectedOwner
        ? selectedOwner.name
        : ''
      updatedBoard[dayIndex][cardIndex].sprintTask!.estimatedDuration =
        String(durationVal)
      updatedBoard[dayIndex][cardIndex].isClosed = isCloased
      setList(updatedBoard)

      updateSprintTask(
        context,
        updatedBoard[dayIndex][cardIndex].sprintTask!.id!,
        selectedOwner?.id,
        durationVal,
        isCloased
      )
    }

    hideModal()
  }
  const onParseStartDateFromString = React.useCallback(
    (newValue: string): Date => {
      const previousValue = plannedStartDate || new Date()
      const newValueParts = (newValue || '').trim().split('/')
      const day =
        newValueParts.length > 0
          ? Math.max(1, Math.min(31, parseInt(newValueParts[0], 10)))
          : previousValue.getDate()
      const month =
        newValueParts.length > 1
          ? Math.max(1, Math.min(12, parseInt(newValueParts[1], 10))) - 1
          : previousValue.getMonth()
      let year =
        newValueParts.length > 2
          ? parseInt(newValueParts[2], 10)
          : previousValue.getFullYear()
      if (year < 100) {
        year +=
          previousValue.getFullYear() - (previousValue.getFullYear() % 100)
      }
      return new Date(year, month, day)
    },
    [plannedStartDate]
  )

  const onParseEndDateFromString = React.useCallback(
    (newValue: string): Date => {
      const previousValue = plannedEndDate || new Date()
      const newValueParts = (newValue || '').trim().split('/')
      const day =
        newValueParts.length > 0
          ? Math.max(1, Math.min(31, parseInt(newValueParts[0], 10)))
          : previousValue.getDate()
      const month =
        newValueParts.length > 1
          ? Math.max(1, Math.min(12, parseInt(newValueParts[1], 10))) - 1
          : previousValue.getMonth()
      let year =
        newValueParts.length > 2
          ? parseInt(newValueParts[2], 10)
          : previousValue.getFullYear()
      if (year < 100) {
        year +=
          previousValue.getFullYear() - (previousValue.getFullYear() % 100)
      }
      return new Date(year, month, day)
    },
    [plannedEndDate]
  )
  return (
    <div className="edit-div">
      <div className="header">
        <Text variant="mediumPlus" nowrap block>
          <b>{editProjectTask ? 'Edit Project Task' : 'Edit Sprint Task'}</b>
        </Text>
        <IconButton
          iconProps={closeIcon}
          className="close-icon"
          onClick={hideModal}
        />
      </div>
      <div className="content">
        {editProjectTask && (
          <>
            <div className="form-row">
              <div className="form-field">
                <Text variant="medium" block className="text-input-label">
                  Planned Start Date:
                </Text>
              </div>
              <div className="form-field" style={{ paddingRight: '3em' }}>
                <DatePicker
                  style={{ width: '100%' }}
                  firstDayOfWeek={DayOfWeek.Monday}
                  placeholder="Select a date..."
                  ariaLabel="Select a date"
                  onSelectDate={
                    setPlannedStartDate as (
                      date: Date | null | undefined
                    ) => void
                  }
                  value={plannedStartDate}
                  formatDate={onFormatDate}
                  parseDateFromString={onParseStartDateFromString}
                  strings={defaultDatePickerStrings}
                  minDate={new Date()}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <Text variant="medium" block className="text-input-label">
                  Planned End Date:
                </Text>
              </div>
              <div className="form-field" style={{ paddingRight: '3em' }}>
                <DatePicker
                  style={{ width: '100%' }}
                  firstDayOfWeek={DayOfWeek.Monday}
                  placeholder="Select a date..."
                  ariaLabel="Select a date"
                  onSelectDate={
                    setPlannedEndDate as (date: Date | null | undefined) => void
                  }
                  value={plannedEndDate}
                  formatDate={onFormatDate}
                  parseDateFromString={onParseEndDateFromString}
                  strings={defaultDatePickerStrings}
                  minDate={plannedStartDate}
                />
              </div>
            </div>
          </>
        )}
        <div className="form-row">
          <div className="form-field">
            <Text variant="medium" block className="text-input-label">
              Owner:
            </Text>
          </div>
          <div className="form-field" style={{ paddingRight: '3em' }}>
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
          <div className="form-field" style={{ paddingRight: '3em' }}>
            <MaskedTextField
              className="text-input"
              maskFormat={maskFormat}
              mask="*.**"
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
          <div className="form-field" style={{ paddingRight: '3em' }}>
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
        {/* <DefaultButton
          text="Cancel"
          onClick={hideModal}
          className="button default-button"
        /> */}
        {/* <PrimaryButton text="Save" className="button" onClick={saveChanges} /> */}

        <CommandBarButton
          iconProps={cancelIcon}
          text="Cancel"
          onClick={hideModal}
          className="button"
        />

        <CommandBarButton
          iconProps={saveIcon}
          text="Save"
          onClick={saveChanges}
          className="button"
        />
      </div>
    </div>
  )
}

export default EditTask
