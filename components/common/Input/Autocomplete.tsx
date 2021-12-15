import { useState, useRef } from 'react'
import { Box, List, ListItem, InputGroup, InputLeftElement, ListItemProps, InputRightElement } from '@chakra-ui/react';
import { Input } from '.';
import { useEffect } from 'react';
import { useOutsideClick } from '@chakra-ui/react'
import { CloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { isAddress } from 'ethers/lib/utils';
import { AutocompleteItem, AutocompleteProps } from '@inverse/types';

const defaultList: AutocompleteItem[] = [];
const defaultInputComp = Input;

const AutocompleteListItem = (props: ListItemProps) => {
    return (
        <ListItem
            height="40px"
            lineHeight="40px"
            textAlign="left"
            pl="4"
            borderBottom="1px solid #cccccc22"
            cursor="pointer"
            transitionProperty="background-color"
            transitionDuration="400ms"
            transitionTimingFunction="ease"
            _hover={{ bgColor: 'info' }}
            overflow="hidden"
            {...props}
        />
    )
}

const EMPTY_ITEM: AutocompleteItem = { label: '', value: '' }

const sortList = (list: AutocompleteItem[]) => {
    list.sort((a, b) => a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1)
}

export const Autocomplete = ({
    title = '',
    list = defaultList,
    defaultValue = '',
    placeholder = '',
    InputComp = defaultInputComp,
    inputProps,
    onItemSelect = () => { },
    isOpenDefault = false,
    autoSort = true,
    ...props
}: AutocompleteProps) => {
    const preselectedItem = list.find(item => item.value === defaultValue) || { label: defaultValue, value: defaultValue };
    const [selectedItem, setSelectedItem] = useState<AutocompleteItem | undefined>(preselectedItem)
    const [searchValue, setSearchValue] = useState(preselectedItem?.label || '')
    const [isOpen, setIsOpen] = useState(isOpenDefault)
    const [unfilteredList, setUnfilteredList] = useState(list)
    const [filteredList, setFilteredList] = useState(list)
    const [notFound, setNotFound] = useState(false)

    const listCompRef = useRef(null)

    useOutsideClick({
        ref: listCompRef,
        handler: () => {
            setIsOpen(false)
        },
    })

    useEffect(() => {
        const newList = [...list]
        if(autoSort) {
            sortList(newList)
        }
        setUnfilteredList(newList)
    }, [autoSort, list])

    useEffect(() => {
        if (!isOpen && (searchValue !== selectedItem?.label && !selectedItem?.isSearchValue)) {
            setSearchValue(selectedItem?.label!)
        }
    }, [searchValue, selectedItem, isOpen])

    useEffect(() => {
        const newList = getFilteredList(unfilteredList, searchValue)
        const notFound = newList.length === 0
        setNotFound(notFound)

        if (notFound && searchValue) {
            newList.push({ label: `Select "${searchValue}"`, value: searchValue, isSearchValue: true });
        }

        setFilteredList(newList)
    }, [searchValue, unfilteredList, autoSort])

    const getFilteredList = (list: AutocompleteItem[], searchValue: string) => {
        const regEx = new RegExp(searchValue?.replace(/([^a-zA-Z0-9])/g, "\\$1"), 'i')
        return list
            .filter(item => regEx.test(item.value) || regEx.test(item.label));
    }

    const handleSelect = (item?: AutocompleteItem, autoClose = true) => {
        setSelectedItem(item)
        if (item) {
            setSearchValue(item.isSearchValue ? item.value : item.label)
        }
        onItemSelect(item || EMPTY_ITEM)
        if (autoClose) {
            setIsOpen(false)
        }
    }

    const clear = () => {
        handleSelect(EMPTY_ITEM, false)
    }

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        if (isAddress(value)) {
            handleSelect({ value, label: value })
        } else {
            const perfectMatch = list.find((item) => item.value.toLowerCase() === value.toLowerCase() || item.label.toLowerCase() === value.toLowerCase())
            const filteredList = getFilteredList(list, value)
            if (perfectMatch && filteredList.length === 1) {
                handleSelect(perfectMatch)
            }
        }
    }

    const handleKeyPress = (e: any) => {
        if(e.key === 'Enter' && searchValue && filteredList.length === 1) {
            handleSelect(filteredList[0])
        }
    }

    const listItems = filteredList
        .map((item, i) => {
            return <AutocompleteListItem
                key={i}
                onClick={() => handleSelect(item)}
                fontWeight={item.value === selectedItem?.value ? 'bold' : 'normal'}
            >
                {item.label}
            </AutocompleteListItem>
        })

    return (
        <Box position="relative" {...props}>
            <InputGroup alignItems="center">
                <InputLeftElement
                    height="100%"
                    onClick={clear}
                    pointer="cursor"
                    children={<CloseIcon color={searchValue ? '#cccccc' : '#cccccc22'} fontSize="12px" boxSize="3" />}
                />
                <InputComp
                    placeholder={placeholder}
                    pl="10"
                    type="search"
                    value={searchValue}
                    textAlign="left"
                    fontSize="12px"
                    onKeyPress={handleKeyPress}
                    onChange={(e: any) => handleSearchChange(e.target.value)}
                    onClick={() => setIsOpen(!isOpen)}
                    {...inputProps}
                />
                <InputRightElement
                    height="100%"
                    children={<ChevronDownIcon />}
                />
            </InputGroup>
            {
                isOpen ?
                    <List
                        ref={listCompRef}
                        position="absolute"
                        className="blurred-container info-bg"
                        w="full"
                        zIndex="10"
                        borderRadius="5"
                        maxH="200px"
                        overflowY="auto"
                        boxShadow="0 0 2px 1px #aaaaaa"
                    >
                        {
                            title && !notFound ?
                                <AutocompleteListItem
                                    cursor="normal"
                                    _hover={{}}
                                    fontSize="16px"
                                    fontWeight="bold"
                                    borderBottom="2px solid #cccccc">
                                    {title}
                                </AutocompleteListItem>
                                : null
                        }
                        {
                            filteredList.length ? listItems :
                                <AutocompleteListItem _hover={{}}>
                                    No Result
                                </AutocompleteListItem>
                        }
                    </List>
                    : null
            }
        </Box>
    )
}